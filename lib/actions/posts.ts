"use server"

import { guardUser } from "@/lib/auth"
import { sanitizeStoryHtml } from "@/lib/sanitize"
import { dbError, firstIssue, revalidateSite } from "@/lib/actions/helpers"
import { createClient } from "@/lib/supabase/server"
import { isReservedSlug } from "@/lib/urls"
import { readingTime } from "@/lib/utils"
import { postSchema } from "@/lib/validations/cms"
import type { ActionResult } from "@/types/app"

type SaveResult = { success: true; id: string; slug: string; status: string; publishedAt: string | null } | { success: false; error: string }

/** Creates (id = null) or updates a post, including its tags. */
export async function savePost(id: string | null, input: unknown): Promise<SaveResult> {
  const guard = await guardUser()
  if (!guard.ok) return { success: false, error: guard.error }
  const parsed = postSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) }

  const { tag_ids, ...fields } = parsed.data
  // Editor HTML is untrusted: sanitize on write as well as on render.
  const content = sanitizeStoryHtml(fields.content)
  const supabase = await createClient()

  const requested = fields.published_at ?? null
  const isPast = requested !== null && new Date(requested).getTime() <= Date.now()
  // draft: keep whatever date it had; scheduled: the (validated, future) date;
  // published: keep an original past date, otherwise go live now.
  const published_at =
    fields.status === "published" ? (isPast ? requested : new Date().toISOString()) : requested

  const row = { ...fields, content, published_at, reading_time: readingTime(content) }

  const { data, error } = id
    ? await supabase.from("posts").update(row).eq("id", id).select("id, slug, status, published_at").single()
    : await supabase
        .from("posts")
        .insert({ ...row, author_id: guard.session.user.id })
        .select("id, slug, status, published_at")
        .single()
  if (error) return { success: false, error: error.code === "23505" ? "Another post already uses this slug." : dbError(error, "post") }

  // Replace tag links.
  const { error: clearError } = await supabase.from("post_tags").delete().eq("post_id", data.id)
  if (clearError) return { success: false, error: dbError(clearError, "tag") }
  if (tag_ids.length) {
    const { error: tagError } = await supabase.from("post_tags").insert(tag_ids.map((tag_id) => ({ post_id: data.id, tag_id })))
    if (tagError) return { success: false, error: dbError(tagError, "tag") }
  }

  revalidateSite()
  return { success: true, id: data.id, slug: data.slug, status: data.status, publishedAt: data.published_at }
}

/** True when no other post uses the slug. */
export async function isSlugAvailable(slug: string, excludeId: string | null): Promise<boolean> {
  const guard = await guardUser()
  if (!guard.ok || !slug) return false
  if (isReservedSlug(slug)) return false
  const supabase = await createClient()
  // RLS hides other authors' drafts, so authors may get a false "available";
  // the unique constraint still catches it on save.
  let query = supabase.from("posts").select("id", { count: "exact", head: true }).eq("slug", slug)
  if (excludeId) query = query.neq("id", excludeId)
  const { count } = await query
  return (count ?? 0) === 0
}

export async function deletePosts(ids: string[]): Promise<ActionResult> {
  const guard = await guardUser()
  if (!guard.ok) return { success: false, error: guard.error }
  if (!ids.length) return { success: true }

  const supabase = await createClient()
  const { data, error } = await supabase.from("posts").delete().in("id", ids).select("id")
  if (error) return { success: false, error: dbError(error, "post") }
  // RLS silently skips rows the user can't delete.
  if ((data?.length ?? 0) < ids.length) {
    revalidateSite()
    return { success: false, error: `Deleted ${data?.length ?? 0} of ${ids.length}. You can only delete your own posts.` }
  }

  revalidateSite()
  return { success: true }
}

export async function duplicatePost(id: string): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const guard = await guardUser()
  if (!guard.ok) return { success: false, error: guard.error }
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from("posts")
    .select("title, slug, excerpt, content, cover_image_url, category_id, reading_time, meta_title, meta_description, faqs, post_tags(tag_id)")
    .eq("id", id)
    .single()
  if (error) return { success: false, error: dbError(error, "post") }

  // Find a free "-copy", "-copy-2", … slug.
  const base = `${post.slug}-copy`
  const { data: taken } = await supabase.from("posts").select("slug").like("slug", `${base}%`)
  const used = new Set((taken ?? []).map((t) => t.slug))
  let slug = base
  for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`

  const { post_tags, ...fields } = post
  const { data: copy, error: insertError } = await supabase
    .from("posts")
    .insert({ ...fields, title: `Copy of ${post.title}`.slice(0, 200), slug, status: "draft", author_id: guard.session.user.id })
    .select("id")
    .single()
  if (insertError) return { success: false, error: dbError(insertError, "post") }

  if (post_tags?.length) {
    await supabase.from("post_tags").insert(post_tags.map((pt) => ({ post_id: copy.id, tag_id: pt.tag_id })))
  }
  return { success: true, id: copy.id }
}
