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

// ---------------------------------------------------------------------------
// Dashboard (v2 design)
// ---------------------------------------------------------------------------

export type DashboardRange = "week" | "month" | "year"
const RANGE_DAYS: Record<DashboardRange, number> = { week: 7, month: 30, year: 365 }
const DAY = 86_400_000

const DASH_COLUMNS =
  "id, title, slug, status, published_at, updated_at, views, reading_time, cover_image_url, author:profiles(full_name), category:categories(name)"

type DashPost = {
  id: string
  title: string
  slug: string
  status: string
  published_at: string | null
  updated_at: string
  views: number
  reading_time: number
  cover_image_url: string | null
  author: { full_name: string | null } | null
  category: { name: string } | null
}

const pctChange = (now: number, before: number) => (before === 0 ? (now === 0 ? 0 : null) : ((now - before) / before) * 100)

/**
 * Everything the dashboard shows for a period. Views are stored as one total
 * per story (no per-day history), so the chart groups each story's views by
 * its publish date.
 */
export async function getDashboard(session: Session, range: DashboardRange) {
  const supabase = await createClient()
  const now = Date.now()
  const days = RANGE_DAYS[range]
  const start = now - days * DAY
  const prevStart = start - days * DAY

  let postsQuery = supabase.from("posts").select(DASH_COLUMNS).limit(5000)
  if (!session.isAdmin) postsQuery = postsQuery.eq("author_id", session.user.id)

  const [postsRes, subsTotal, subsBefore] = await Promise.all([
    postsQuery,
    session.isAdmin ? supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).then((r) => r.count ?? 0) : null,
    session.isAdmin
      ? supabase
          .from("newsletter_subscribers")
          .select("id", { count: "exact", head: true })
          .lt("created_at", new Date(start).toISOString())
          .then((r) => r.count ?? 0)
      : null,
  ])
  if (postsRes.error) throw postsRes.error
  const posts = (postsRes.data ?? []) as unknown as DashPost[]

  const time = (iso: string | null) => (iso ? new Date(iso).getTime() : NaN)
  const isLive = (p: DashPost) => p.status !== "draft" && time(p.published_at) <= now
  const live = posts.filter(isLive)
  const inWindow = (p: DashPost, from: number, to: number) => time(p.published_at) >= from && time(p.published_at) < to

  // Chart buckets: days for week/month, calendar months for a year.
  const buckets: { key: string; label: string; from: number; to: number }[] = []
  if (range === "year") {
    const d = new Date(now)
    for (let i = 11; i >= 0; i--) {
      const from = new Date(d.getFullYear(), d.getMonth() - i, 1).getTime()
      const to = new Date(d.getFullYear(), d.getMonth() - i + 1, 1).getTime()
      buckets.push({ key: String(from), label: new Date(from).toLocaleDateString("en-GB", { month: "short" }), from, to })
    }
  } else {
    const today = new Date(now)
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).getTime()
    for (let i = days - 1; i >= 0; i--) {
      const from = endOfToday - (i + 1) * DAY
      buckets.push({ key: String(from), label: new Date(from).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), from, to: from + DAY })
    }
  }
  const series = buckets.map((b) => ({
    label: b.label,
    views: live.filter((p) => inWindow(p, b.from, b.to)).reduce((n, p) => n + p.views, 0),
    stories: live.filter((p) => inWindow(p, b.from, b.to)).length,
  }))

  const viewsNow = live.filter((p) => inWindow(p, start, now + 1)).reduce((n, p) => n + p.views, 0)
  const viewsPrev = live.filter((p) => inWindow(p, prevStart, start)).reduce((n, p) => n + p.views, 0)
  const publishedNow = live.filter((p) => inWindow(p, start, now + 1)).length
  const publishedPrev = live.filter((p) => inWindow(p, prevStart, start)).length

  const nextScheduled =
    posts
      .filter((p) => p.status === "scheduled" && time(p.published_at) > now)
      .sort((a, b) => time(a.published_at) - time(b.published_at))[0] ?? null

  return {
    series,
    views: { total: viewsNow, change: pctChange(viewsNow, viewsPrev), allTime: live.reduce((n, p) => n + p.views, 0) },
    published: { total: publishedNow, previous: publishedPrev, change: pctChange(publishedNow, publishedPrev) },
    subscribers:
      subsTotal === null || subsBefore === null ? null : { total: subsTotal, previous: subsBefore, change: pctChange(subsTotal, subsBefore) },
    drafts: posts.filter((p) => p.status === "draft").length,
    nextScheduled,
    top: [...live].sort((a, b) => b.views - a.views).slice(0, 3),
    recent: [...posts].sort((a, b) => time(b.updated_at) - time(a.updated_at)).slice(0, 4),
  }
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>

/** Items for the top-bar bell: stories going live soon, drafts, new subscribers. */
export async function getNotifications(session: Session) {
  const supabase = await createClient()
  const nowIso = new Date().toISOString()
  const weekAgo = new Date(Date.now() - 7 * DAY).toISOString()

  let scheduled = supabase
    .from("posts")
    .select("id, title, published_at")
    .eq("status", "scheduled")
    .gt("published_at", nowIso)
    .order("published_at")
    .limit(5)
  let drafts = supabase.from("posts").select("id", { count: "exact", head: true }).eq("status", "draft")
  if (!session.isAdmin) {
    scheduled = scheduled.eq("author_id", session.user.id)
    drafts = drafts.eq("author_id", session.user.id)
  }

  const [s, d, subs] = await Promise.all([
    scheduled,
    drafts,
    session.isAdmin
      ? supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }).gte("created_at", weekAgo).then((r) => r.count ?? 0)
      : Promise.resolve(0),
  ])
  return { scheduled: s.data ?? [], drafts: d.count ?? 0, newSubscribers: subs }
}

export type Notifications = Awaited<ReturnType<typeof getNotifications>>
