/* eslint-disable @typescript-eslint/no-explicit-any -- WordPress JSON is untyped */
// Imports all published posts from the old WordPress site into Supabase.
//
//   node scripts/import-wordpress.mts            dry run: fetch + convert, report, write nothing
//   node scripts/import-wordpress.mts --apply    back up, import, then delete the previous posts
//
// Images (featured + inside posts) are copied into Supabase Storage under the
// admin's blog/ folder, so they appear in Admin → Media → Blog media and no
// longer depend on the WordPress server.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import { extractFaqHeadingSection, extractFaqSection } from "./wp-faqs.mts"

const WP = "https://www.mainstreamtech.co.uk/wp-json/wp/v2"
const UA = { "User-Agent": "Mozilla/5.0 (MainstreamTech importer)" }
const APPLY = process.argv.includes("--apply")
const BUCKET = "blog-images"
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"])
const FEATURED_COUNT = 4

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
)
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const log = (...a: unknown[]) => console.log(...a)
const must = <T,>(label: string, r: { data: T; error: { message: string } | null }): T => {
  if (r.error) throw new Error(`${label}: ${r.error.message}`)
  return r.data
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" }
function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED[name.toLowerCase()] ?? m)
}
const stripTags = (html: string) => decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
const escapeAttr = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;")
const readingTime = (html: string) => Math.max(1, Math.round(stripTags(html).split(" ").filter(Boolean).length / 225))
const cleanSeoTitle = (t: string) => decodeEntities(t).replace(/\s*[-|–]\s*Mainstream Tech\s*$/i, "").trim()

// ---------------------------------------------------------------------------
// Media: download from WordPress, upload to Supabase Storage (blog folder)
// ---------------------------------------------------------------------------

let adminId = ""
const uploaded = new Map<string, string>() // original URL → new public URL
const mediaFailures: string[] = []
let uploadCount = 0

/** Candidate URLs for an <img>: srcset entries largest first, then src. */
function candidates(tag: string): string[] {
  const src = tag.match(/\ssrc="([^"]+)"/)?.[1]
  const srcset = tag.match(/\ssrcset="([^"]+)"/)?.[1]
  const list: { url: string; w: number }[] = []
  if (srcset) {
    for (const part of decodeEntities(srcset).split(",")) {
      const [url, size] = part.trim().split(/\s+/)
      if (url) list.push({ url, w: parseInt(size) || 0 })
    }
  }
  list.sort((a, b) => b.w - a.w)
  const urls = list.map((c) => c.url)
  if (src) urls.push(decodeEntities(src))
  return [...new Set(urls)]
}

async function copyImage(urls: string[]): Promise<string | null> {
  const key = urls[urls.length - 1] ?? urls[0]
  if (!key) return null
  if (uploaded.has(key)) return uploaded.get(key)!
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: UA })
      if (!res.ok) continue
      const type = (res.headers.get("content-type") ?? "").split(";")[0].trim()
      if (!ALLOWED.has(type)) continue
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length > MAX_BYTES) continue // try the next (smaller) size
      if (!APPLY) {
        uploaded.set(key, `(dry-run) ${url}`)
        return uploaded.get(key)!
      }
      const file = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "image")
      const dot = file.lastIndexOf(".")
      const base = (dot > 0 ? file.slice(0, dot) : file).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "image"
      const ext = dot > 0 ? file.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "jpg"
      const path = `${adminId}/blog/${Date.now()}-${uploadCount++}-${base}.${ext}`
      const { error } = await db.storage.from(BUCKET).upload(path, buf, { contentType: type, cacheControl: "31536000" })
      if (error) throw new Error(error.message)
      const publicUrl = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
      uploaded.set(key, publicUrl)
      return publicUrl
    } catch (e) {
      mediaFailures.push(`${url}: ${(e as Error).message}`)
    }
  }
  mediaFailures.push(`no usable size for ${key}`)
  return null
}

// ---------------------------------------------------------------------------
// Content conversion
// ---------------------------------------------------------------------------

const stats = { youtube: 0, images: 0, imageFallbacks: 0, shortcodesRemoved: 0 }

function youtubeId(html: string): string | null {
  return (
    html.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{6,})/)?.[1] ??
    html.match(/youtube\.com\/watch\?v=([\w-]{6,})/)?.[1] ??
    html.match(/youtu\.be\/([\w-]{6,})/)?.[1] ??
    null
  )
}
const youtubeEmbed = (id: string) =>
  `<div data-youtube-video=""><iframe src="https://www.youtube-nocookie.com/embed/${id}" width="640" height="360" allowfullscreen="true"></iframe></div>`
const caption = (html: string) => {
  const c = html.match(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/)?.[1]
  return c && stripTags(c) ? `<p><em>${c.trim()}</em></p>` : ""
}

async function convertContent(html: string): Promise<string> {
  let out = html

  // YouTube embeds (Gutenberg embed blocks), then any leftover bare iframes.
  out = out.replace(/<figure class="wp-block-embed[^"]*"[^>]*>([\s\S]*?)<\/figure>/g, (block, inner: string) => {
    const id = youtubeId(inner)
    if (!id) return block
    stats.youtube++
    return youtubeEmbed(id) + caption(inner)
  })
  out = out.replace(/<iframe[^>]*src="([^"]+)"[^>]*><\/iframe>/g, (tag, src: string) => {
    if (tag.includes("youtube-nocookie.com/embed/")) return tag
    const id = youtubeId(src)
    if (!id) return ""
    stats.youtube++
    return youtubeEmbed(id)
  })

  // Image blocks: copy the image, keep alt text and caption.
  const imageBlocks = [...out.matchAll(/<figure class="wp-block-image[^"]*"[^>]*>([\s\S]*?)<\/figure>/g)]
  for (const m of imageBlocks) {
    const img = m[1].match(/<img\b[^>]*>/)?.[0]
    if (!img) continue
    const alt = decodeEntities(img.match(/\salt="([^"]*)"/)?.[1] ?? "")
    const url = await copyImage(candidates(img))
    stats.images++
    if (!url) stats.imageFallbacks++
    const src = url ?? decodeEntities(img.match(/\ssrc="([^"]+)"/)?.[1] ?? "")
    out = out.replace(m[0], `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}">` + caption(m[1]))
  }

  // Any other images still pointing at WordPress.
  const looseImgs = [...out.matchAll(/<img\b[^>]*src="https?:\/\/(?:www\.)?mainstreamtech\.co\.uk[^"]*"[^>]*>/g)]
  for (const m of looseImgs) {
    const alt = decodeEntities(m[0].match(/\salt="([^"]*)"/)?.[1] ?? "")
    const url = await copyImage(candidates(m[0]))
    stats.images++
    if (!url) stats.imageFallbacks++
    if (url) out = out.replace(m[0], `<img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}">`)
  }

  // Leftover accordion shortcodes from a WordPress plugin.
  out = out.replace(/\[\/?open\]/g, () => {
    stats.shortcodesRemoved++
    return ""
  })

  // Drop paragraphs left empty by the above.
  return out.replace(/<p>\s*<\/p>/g, "").trim()
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type WpTerm = { id: number; name: string; slug: string; taxonomy: string; description?: string }

async function wp<T>(path: string): Promise<T> {
  const res = await fetch(`${WP}/${path}`, { headers: UA })
  if (!res.ok) throw new Error(`WordPress ${path}: ${res.status}`)
  return (await res.json()) as T
}

log(APPLY ? "=== IMPORT (apply) ===" : "=== DRY RUN (no changes will be written) ===")

const admin = must("admin", await db.from("profiles").select("id").eq("role", "admin").order("created_at").limit(1).single())
adminId = admin.id

const wpPosts = await wp<any[]>("posts?per_page=100&_embed=1&status=publish")
const wpCategories = await wp<WpTerm[]>("categories?per_page=100")
const wpUsers = await wp<{ id: number; name: string }[]>("users?per_page=100")
log(`WordPress: ${wpPosts.length} posts, ${wpCategories.length} categories`)

const existing = must("posts", await db.from("posts").select("id, slug"))
log(`Current posts to replace: ${existing.length}`)

// 1. Backup
if (APPLY) {
  const full = must("backup posts", await db.from("posts").select("id, title, slug, excerpt, content, cover_image_url, status, published_at, author_id, category_id, featured, views, reading_time, meta_title, meta_description, faqs, created_at, updated_at"))
  const links = must("backup tags", await db.from("post_tags").select("post_id, tag_id"))
  mkdirSync(new URL("../backups/", import.meta.url), { recursive: true })
  const file = new URL(`../backups/posts-before-wordpress-import-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, import.meta.url)
  writeFileSync(file, JSON.stringify({ posts: full, post_tags: links }, null, 2))
  log(`✓ Backed up ${full.length} posts to ${decodeURIComponent(file.pathname).replace(/^\//, "")}`)
}

// 2. Categories and tags used by the posts
const usedCatSlugs = new Set<string>()
const usedTags = new Map<string, string>()
for (const p of wpPosts) {
  const terms: WpTerm[][] = p._embedded?.["wp:term"] ?? []
  const primary = terms[0]?.[0]
  if (primary) usedCatSlugs.add(primary.slug)
  for (const t of terms[1] ?? []) usedTags.set(t.slug, decodeEntities(t.name))
}
const catRows = wpCategories.filter((c) => usedCatSlugs.has(c.slug)).map((c) => ({ name: decodeEntities(c.name), slug: c.slug, description: c.description ? stripTags(c.description) : null }))
let catId = new Map<string, string>()
const tagId = new Map<string, string>()
if (APPLY) {
  const cats = must("categories", await db.from("categories").upsert(catRows, { onConflict: "slug" }).select("id, slug"))
  catId = new Map(cats.map((c) => [c.slug, c.id]))
  const tagRows = [...usedTags].map(([slug, name]) => ({ slug, name }))
  for (let i = 0; i < tagRows.length; i += 200) {
    const tags = must("tags", await db.from("tags").upsert(tagRows.slice(i, i + 200), { onConflict: "slug" }).select("id, slug"))
    for (const t of tags) tagId.set(t.slug, t.id)
  }
}
log(`Categories: ${catRows.map((c) => c.name).join(", ")} | tags: ${usedTags.size}`)

// 3. Convert posts (and copy media)
const newest = [...wpPosts].sort((a, b) => b.date_gmt.localeCompare(a.date_gmt)).slice(0, FEATURED_COUNT).map((p) => p.id)
const authorOf = new Map(wpUsers.map((u) => [u.id, u.name]))
const manifest: { slug: string; title: string; wordpressAuthor: string; wordpressUrl: string }[] = []
const rows: Record<string, unknown>[] = []
const tagLinks: { slug: string; tagSlugs: string[] }[] = []

for (const [i, p] of wpPosts.entries()) {
  const converted = await convertContent(p.content.rendered)
  const fromBlock = extractFaqSection(converted)
  const { content, faqs } = fromBlock.faqs.length ? fromBlock : extractFaqHeadingSection(converted)
  const featuredMedia = p._embedded?.["wp:featuredmedia"]?.[0]
  const coverCandidates = featuredMedia
    ? [
        ...Object.values((featuredMedia.media_details?.sizes ?? {}) as Record<string, { source_url: string; width: number }>)
          .sort((a, b) => b.width - a.width)
          .map((s) => s.source_url),
        featuredMedia.source_url,
      ].filter(Boolean)
    : []
  // Largest first; copyImage falls back to smaller sizes if over 5 MB.
  const cover = coverCandidates.length ? await copyImage([...new Set([featuredMedia.source_url, ...coverCandidates])]) : null
  const yoast = p.yoast_head_json ?? {}
  const terms: WpTerm[][] = p._embedded?.["wp:term"] ?? []
  const excerpt = stripTags(p.excerpt?.rendered ?? "").replace(/\s*\[…\]$|\s*\[&hellip;\]$/, "").slice(0, 400) || null

  rows.push({
    title: decodeEntities(p.title.rendered).slice(0, 200),
    slug: p.slug,
    excerpt,
    content,
    faqs,
    cover_image_url: cover && !cover.startsWith("(dry-run)") ? cover : null,
    status: "published",
    published_at: `${p.date_gmt}Z`,
    author_id: null,
    category_id: catId.get(terms[0]?.[0]?.slug ?? "") ?? null,
    featured: newest.includes(p.id),
    views: 0,
    reading_time: readingTime(content),
    meta_title: yoast.title ? cleanSeoTitle(yoast.title) : null,
    meta_description: yoast.description ? decodeEntities(yoast.description) : null,
  })
  tagLinks.push({ slug: p.slug, tagSlugs: (terms[1] ?? []).map((t) => t.slug) })
  manifest.push({ slug: p.slug, title: decodeEntities(p.title.rendered), wordpressAuthor: authorOf.get(p.author) ?? `user ${p.author}`, wordpressUrl: p.link })
  process.stdout.write(`\r  converted ${i + 1}/${wpPosts.length}`)
}
log("")
log(`Converted: ${stats.youtube} YouTube embeds, ${stats.images} in-post images (${stats.imageFallbacks} kept on WordPress), ${stats.shortcodesRemoved} shortcodes removed`)
log(`Media copied: ${uploaded.size} unique images${APPLY ? " → Storage blog folder" : " (dry run: checked, not uploaded)"}${mediaFailures.length ? ` | ${mediaFailures.length} issues` : ""}`)
for (const f of mediaFailures.slice(0, 8)) log("   ! " + f)

const clash = rows.filter((r) => ["about", "admin", "api", "auth", "author", "blog", "category", "contact", "login", "preview", "search", "tag"].includes(String(r.slug)))
if (clash.length) throw new Error(`Slugs that clash with site pages: ${clash.map((r) => r.slug).join(", ")}`)

if (!APPLY) {
  const s = rows[0]
  log("Sample:", JSON.stringify({ title: s.title, slug: s.slug, published_at: s.published_at, meta_title: s.meta_title, reading_time: s.reading_time, excerpt: String(s.excerpt).slice(0, 90) }))
  log("Dry run finished — nothing was written.")
  process.exit(0)
}

// 4. Insert new posts (old ones stay until this succeeds)
const oldIds = existing.map((p) => p.id)
const oldSlugs = new Set(existing.map((p) => p.slug))
const clashing = rows.filter((r) => oldSlugs.has(String(r.slug))).map((r) => r.slug)
if (clashing.length) {
  // Same slug already exists: remove those old rows first so the insert can't conflict.
  must("free slugs", await db.from("posts").delete().in("slug", clashing as string[]))
}
const inserted = must("insert posts", await db.from("posts").insert(rows).select("id, slug"))
const postId = new Map(inserted.map((p) => [p.slug, p.id]))
const links = tagLinks.flatMap((l) => l.tagSlugs.map((t) => ({ post_id: postId.get(l.slug)!, tag_id: tagId.get(t)! })).filter((x) => x.post_id && x.tag_id))
for (let i = 0; i < links.length; i += 500) must("post tags", await db.from("post_tags").insert(links.slice(i, i + 500)))
log(`✓ Inserted ${inserted.length} posts and ${links.length} tag links`)

// 5. Delete the previous posts
const toDelete = oldIds.filter((id) => !inserted.some((p) => p.id === id))
if (toDelete.length) must("delete old posts", await db.from("posts").delete().in("id", toDelete))
log(`✓ Deleted ${toDelete.length} previous posts`)

// 6. Remove starter categories/tags left with no posts
const cats = must("categories", await db.from("categories").select("id, name, posts(count)"))
const emptyCats = cats.filter((c: any) => (c.posts?.[0]?.count ?? 0) === 0)
if (emptyCats.length) must("delete empty categories", await db.from("categories").delete().in("id", emptyCats.map((c) => c.id)))
const tags = must("tags", await db.from("tags").select("id, post_tags(count)"))
const emptyTags = tags.filter((t: any) => (t.post_tags?.[0]?.count ?? 0) === 0)
for (let i = 0; i < emptyTags.length; i += 200) must("delete empty tags", await db.from("tags").delete().in("id", emptyTags.slice(i, i + 200).map((t) => t.id)))
log(`✓ Removed ${emptyCats.length} empty categories (${emptyCats.map((c) => c.name).join(", ") || "none"}) and ${emptyTags.length} unused tags`)

// 7. Author manifest (for reassigning bylines once writers have accounts)
const manifestFile = new URL("../backups/wordpress-authors.json", import.meta.url)
writeFileSync(manifestFile, JSON.stringify(manifest, null, 2))
log(`✓ Wrote author list to backups/wordpress-authors.json`)
log("Import complete.")
