import "server-only"
import type { Session } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

// CMS reads. They run as the signed-in user, so RLS applies; authors are also
// filtered to their own posts explicitly (RLS alone would include everyone's
// published posts).

export const ADMIN_PAGE_SIZE = 15

export type PostSort = "updated" | "published" | "views" | "title"
export type PostListFilter = {
  q?: string
  status?: string
  category?: string
  author?: string
  sort?: PostSort
  page?: number
}

const POST_LIST_COLUMNS =
  "id, title, slug, status, published_at, updated_at, views, featured, author_id, category:categories(id, name), author:profiles(id, full_name, username)"

export async function listPosts(session: Session, filter: PostListFilter) {
  const supabase = await createClient()
  const page = Math.max(1, filter.page ?? 1)
  const from = (page - 1) * ADMIN_PAGE_SIZE

  let query = supabase.from("posts").select(POST_LIST_COLUMNS, { count: "exact" })
  if (!session.isAdmin) query = query.eq("author_id", session.user.id)
  else if (filter.author) query = query.eq("author_id", filter.author)
  if (filter.status === "draft" || filter.status === "published" || filter.status === "scheduled") query = query.eq("status", filter.status)
  if (filter.category) query = query.eq("category_id", filter.category)
  if (filter.q) query = query.ilike("title", `%${filter.q.replace(/[%_]/g, "\\$&")}%`)

  const sort = filter.sort ?? "updated"
  const order = { updated: "updated_at", published: "published_at", views: "views", title: "title" }[sort]
  query = query.order(order, { ascending: sort === "title", nullsFirst: false }).range(from, from + ADMIN_PAGE_SIZE - 1)

  const { data, count, error } = await query
  if (error) throw error
  return { posts: data ?? [], total: count ?? 0, page, totalPages: Math.max(1, Math.ceil((count ?? 0) / ADMIN_PAGE_SIZE)) }
}

export type AdminPostRow = Awaited<ReturnType<typeof listPosts>>["posts"][number]

export async function getDashboardData(session: Session) {
  const supabase = await createClient()
  const mine = <T extends { eq: (col: "author_id", v: string) => T }>(q: T) => (session.isAdmin ? q : q.eq("author_id", session.user.id))

  const count = async (status?: string) => {
    let q = supabase.from("posts").select("id", { count: "exact", head: true })
    q = mine(q)
    if (status) q = q.eq("status", status)
    const { count } = await q
    return count ?? 0
  }

  const [total, published, drafts, scheduled, viewsRes, recentRes, topRes, subscribers] = await Promise.all([
    count(),
    count("published"),
    count("draft"),
    count("scheduled"),
    mine(supabase.from("posts").select("views")),
    mine(supabase.from("posts").select(POST_LIST_COLUMNS)).order("updated_at", { ascending: false }).limit(6),
    mine(supabase.from("posts").select("id, title, slug, views"))
      .in("status", ["published", "scheduled"])
      .order("views", { ascending: false })
      .limit(7),
    session.isAdmin
      ? supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0)
      : Promise.resolve(null),
  ])

  return {
    stats: {
      total,
      published,
      drafts,
      scheduled,
      views: (viewsRes.data ?? []).reduce((n, p) => n + (p.views ?? 0), 0),
      subscribers,
    },
    recent: recentRes.data ?? [],
    top: topRes.data ?? [],
  }
}

export async function getCategoriesWithCounts() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("categories").select("id, name, slug, description, created_at, posts(count)").order("name")
  if (error) throw error
  return (data ?? []).map(({ posts, ...c }) => ({ ...c, postCount: (posts as unknown as { count: number }[])[0]?.count ?? 0 }))
}

export async function getTagsWithCounts() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("tags").select("id, name, slug, created_at, post_tags(count)").order("name")
  if (error) throw error
  return (data ?? []).map(({ post_tags, ...t }) => ({ ...t, postCount: (post_tags as unknown as { count: number }[])[0]?.count ?? 0 }))
}

export async function getAuthorsForFilter() {
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("id, full_name, username").order("full_name")
  return data ?? []
}

export async function getPostForEdit(session: Session, id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, title, slug, excerpt, content, cover_image_url, status, published_at, author_id, category_id, featured, views, reading_time, meta_title, meta_description, created_at, updated_at, post_tags(tag_id)"
    )
    .eq("id", id)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  // RLS lets authors read any published post; editing is for owners and admins only.
  if (!session.isAdmin && data.author_id !== session.user.id) return null
  const { post_tags, ...post } = data
  return { ...post, tagIds: (post_tags ?? []).map((pt) => pt.tag_id) }
}

export type EditablePost = NonNullable<Awaited<ReturnType<typeof getPostForEdit>>>
