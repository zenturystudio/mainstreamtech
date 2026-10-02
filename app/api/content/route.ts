import { z } from "zod"
import { NextResponse } from "next/server"
import { revalidateSite } from "@/lib/actions/helpers"
import { MAX_JSON_BYTES, apiError, authError, plainText, prepareClomarkHtml, rateLimit, rehostImage } from "@/lib/clomark"
import { createAdminClient } from "@/lib/supabase/admin"
import { RESERVED_SLUGS, postPath } from "@/lib/urls"
import { absoluteUrl, readingTime } from "@/lib/utils"
import type { Json } from "@/types/database.types"

/**
 * Clomark receiver: Clomark's "Custom API" publisher sends finished blog posts
 * here. Contract (fixed by Clomark):
 *   HEAD /api/content            x-api-key → 2xx  ("Test connection")
 *   POST /api/content            x-api-key + JSON → 2xx { url } | non-2xx { error }
 *
 * Posts are saved with source = "clomark". Only posts that came from Clomark
 * can be overwritten; a slug used by any other post returns 409. Posts are
 * drafts for review unless CLOMARK_AUTO_PUBLISH=true.
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

/** Cuts at a word boundary; meta fields have CMS limits (70 / 170). */
const clip = (max: number) => (v: string) => {
  const t = v.trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max - 1)
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 15)).trimEnd()}…`
}
const optionalString = (max: number) =>
  z
    .string()
    .nullish()
    .transform((v) => (v?.trim() ? clip(max)(v) : null))

const bodySchema = z.object({
  title: z.string({ error: "title is required" }).trim().min(1, "title is required").max(200, "title must be 200 characters or fewer"),
  slug: z
    .string({ error: "slug is required" })
    .trim()
    .min(1, "slug is required")
    .max(120, "slug must be 120 characters or fewer")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug may only use lowercase letters, digits and single hyphens"),
  content: z.string().default(""),
  excerpt: optionalString(400),
  metaTitle: optionalString(70),
  metaDescription: optionalString(170),
  featuredImage: z
    .string()
    .nullish()
    .transform((v) => v?.trim() || null),
  wordCount: z.number().int().nonnegative().nullish(),
  faqs: z
    .array(
      z.object({
        question: z.string().transform(plainText).pipe(z.string().min(1, "FAQ question is empty").max(200, "FAQ questions are limited to 200 characters")),
        answer: z.string().transform(plainText).pipe(z.string().min(1, "FAQ answer is empty").max(2000, "FAQ answers are limited to 2,000 characters")),
      })
    )
    .max(20, "up to 20 FAQs per post")
    .nullish()
    .transform((v) => v ?? []),
  focusKeyword: optionalString(200),
  // Clomark sends "blog_post" for some sites and "blog" for others; both mean a blog post.
  contentType: z.enum(["blog", "blog_post"], { error: 'contentType must be "blog" or "blog_post"' }).nullish(),
  status: z.enum(["published", "draft"], { error: 'status must be "published" or "draft"' }).nullish(),
  allowOverwrite: z.boolean().nullish(),
  campaign: z.unknown().optional(),
})

const LIVE = new Set(["published", "scheduled"])

/** "Test connection". */
export async function HEAD(request: Request) {
  const limited = await rateLimit(request, "content")
  if (limited) return new Response(null, { status: limited.status, headers: limited.headers })
  const denied = authError(request)
  return new Response(null, { status: denied ? denied.status : 200, headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, "content")
  if (limited) return limited
  const denied = authError(request)
  if (denied) return denied

  // --- Read + validate -------------------------------------------------------
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json"))
    return apiError(415, "Send the body as application/json")
  if (Number(request.headers.get("content-length") ?? 0) > MAX_JSON_BYTES) return apiError(413, "Body is larger than 500 KB")
  const raw = await request.arrayBuffer()
  if (raw.byteLength > MAX_JSON_BYTES) return apiError(413, "Body is larger than 500 KB")

  let json: unknown
  try {
    json = JSON.parse(new TextDecoder().decode(raw))
  } catch {
    return apiError(400, "Body is not valid JSON")
  }
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const field = issue?.path.join(".")
    return apiError(400, issue ? (field && !issue.message.includes(field.split(".")[0]) ? `${field}: ${issue.message}` : issue.message) : "Invalid body")
  }
  const input = parsed.data
  if ((RESERVED_SLUGS as readonly string[]).includes(input.slug))
    return apiError(409, `The slug "${input.slug}" is used by a page on this site. Choose a different slug.`)

  // --- Ownership check -------------------------------------------------------
  const db = createAdminClient()
  const { data: existing, error: findError } = await db
    .from("posts")
    .select("id, source, source_meta, status, published_at, cover_image_url")
    .eq("slug", input.slug)
    .maybeSingle()
  if (findError) return serverError("lookup", findError.message)

  if (existing && existing.source !== "clomark")
    return apiError(409, `The slug "${input.slug}" belongs to a post that wasn't created by Clomark, so it can't be overwritten. Use a different slug.`)
  if (existing && input.allowOverwrite !== true)
    return apiError(409, `A Clomark post with the slug "${input.slug}" already exists. Send allowOverwrite: true to update it.`)

  // --- Publishing decision ---------------------------------------------------
  const autoPublish = process.env.CLOMARK_AUTO_PUBLISH?.trim().toLowerCase() === "true"
  const publish = autoPublish && input.status === "published"
  const wasLive = !!existing && LIVE.has(existing.status)
  if (wasLive && !autoPublish)
    return apiError(
      409,
      `"${input.slug}" is already live and auto-publish is off, so it can't be changed from Clomark. Edit it in the site's admin, or set CLOMARK_AUTO_PUBLISH=true.`
    )

  // --- Images (never hot-link) -----------------------------------------------
  const previousMeta = (existing?.source_meta ?? {}) as { featuredImageSource?: string }
  let cover: string | null = existing?.cover_image_url ?? null
  // No featuredImage: keep whatever cover the post has (an editor may have set one).
  if (!input.featuredImage) {
    // keep cover
  } else if (input.featuredImage !== previousMeta.featuredImageSource || !cover) {
    try {
      cover = await rehostImage(input.featuredImage)
    } catch (e) {
      return apiError(422, `featuredImage ${(e as Error).message}`)
    }
  }

  const warnings: string[] = []
  let content = prepareClomarkHtml(input.content, { title: input.title, hasFaqs: input.faqs.length > 0 })
  content = await rehostInlineImages(content, warnings)

  // --- Save ------------------------------------------------------------------
  const sourceMeta: Json = {
    contentType: input.contentType ?? "blog",
    focusKeyword: input.focusKeyword,
    wordCount: input.wordCount ?? null,
    campaign: (input.campaign ?? null) as Json,
    featuredImageSource: input.featuredImage,
    requestedStatus: input.status ?? "draft",
    receivedAt: new Date().toISOString(),
  }
  if (JSON.stringify(sourceMeta.campaign).length > 4000) sourceMeta.campaign = null

  const fields = {
    title: input.title,
    content,
    excerpt: input.excerpt,
    meta_title: input.metaTitle,
    meta_description: input.metaDescription,
    cover_image_url: cover,
    faqs: input.faqs,
    reading_time: input.wordCount ? Math.max(1, Math.round(input.wordCount / 225)) : readingTime(content),
    status: publish ? "published" : "draft",
    // Keep the original date when re-publishing a live post; drafts keep any earlier date.
    published_at: publish ? (wasLive && existing?.published_at ? existing.published_at : new Date().toISOString()) : (existing?.published_at ?? null),
    source: "clomark",
    source_meta: sourceMeta,
  }

  // Category, tags, author and "featured" are left alone on updates: editors set those.
  const result = existing
    ? await db.from("posts").update(fields).eq("id", existing.id).eq("source", "clomark").select("id, slug, status").single()
    : await db
        .from("posts")
        .insert({ ...fields, slug: input.slug, author_id: null, category_id: await defaultCategoryId(db) })
        .select("id, slug, status")
        .single()
  if (result.error) {
    if (result.error.code === "23505") return apiError(409, `The slug "${input.slug}" was just taken by another post. Retry or use a different slug.`)
    return serverError("save", result.error.message)
  }

  // --- Make it live ----------------------------------------------------------
  // Public pages are ISR-cached; refresh them when a live post appears, changes or is unpublished.
  if (publish || wasLive) revalidateSite()

  const post = result.data
  return NextResponse.json(
    {
      url: absoluteUrl(postPath(post.slug)),
      id: post.id,
      status: post.status,
      created: !existing,
      editUrl: absoluteUrl(`/admin/posts/${post.id}`),
      ...(post.status === "draft" ? { note: "Saved as a draft for review; publish it in the site's admin." } : {}),
      ...(warnings.length ? { warnings } : {}),
    },
    { status: existing ? 200 : 201, headers: { "Cache-Control": "no-store" } }
  )
}

/** Copies images in the body to our storage; ones that fail are kept and reported. */
async function rehostInlineImages(html: string, warnings: string[]): Promise<string> {
  const sources = [...new Set([...html.matchAll(/<img\b[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]))].slice(0, 20)
  const decode = (s: string) => s.replace(/&amp;/g, "&")
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
  let out = html
  for (const src of sources) {
    try {
      const url = await rehostImage(decode(src))
      out = out.split(`src="${src}"`).join(`src="${escape(url)}"`)
    } catch (e) {
      warnings.push(`Image ${decode(src)} ${(e as Error).message}; kept the original link.`)
    }
  }
  return out
}

/**
 * Clomark sends no category, so new posts go into CLOMARK_DEFAULT_CATEGORY
 * (a category slug, default "technology"). Editors can change it in the admin.
 */
async function defaultCategoryId(db: ReturnType<typeof createAdminClient>): Promise<string | null> {
  const slug = process.env.CLOMARK_DEFAULT_CATEGORY?.trim() || "technology"
  const { data } = await db.from("categories").select("id").eq("slug", slug).maybeSingle()
  if (!data) console.error(`[clomark] default category "${slug}" not found; post saved without a category`)
  return data?.id ?? null
}

function serverError(step: string, message: string) {
  console.error(`[clomark] ${step} failed:`, message)
  return apiError(500, "Could not save the post. Try again later.")
}
