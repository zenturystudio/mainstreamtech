import "server-only"
import { cache } from "react"
import { createPublicClient } from "@/lib/supabase/server"
import { siteConfig } from "@/lib/site"
import type { Author, Category, Paginated, Post, PostSummary, Tag, WithCount } from "@/types/app"

// Public reads. Uses the cookie-less anon client, so RLS limits results to
// live posts and pages stay ISR-cacheable. Filters repeat the RLS rule so the
// intent is visible here too.

export const DEFAULT_POSTS_PER_PAGE = 9
export type SortOrder = "latest" | "popular"

const AUTHOR = "author:profiles(id, full_name, username, avatar_url, bio, role)"
const CATEGORY = "category:categories(id, name, slug, description)"
const TAGS = "post_tags(tag:tags(id, name, slug))"
const SUMMARY_COLUMNS = `id, title, slug, excerpt, cover_image_url, status, published_at, featured, views, reading_time, meta_title, meta_description, ${AUTHOR}, ${CATEGORY}, ${TAGS}`
const POST_COLUMNS = `${SUMMARY_COLUMNS}, content`

/** Byline used when a post's author account no longer exists. */
export const STAFF_AUTHOR: Author = {
  id: "staff",
  full_name: siteConfig.name,
  username: null,
  avatar_url: null,
  bio: null,
  role: "author",
}

type Row = {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image_url: string | null
  status: string
  published_at: string | null
  featured: boolean
  views: number
  reading_time: number
  meta_title: string | null
  meta_description: string | null
  content?: string
  author: Author | null
  category: Category | null
  post_tags: { tag: Tag | null }[] | null
}

function toSummary(row: Row): PostSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    cover_image_url: row.cover_image_url,
    status: row.status as Post["status"],
    published_at: row.published_at,
    featured: row.featured,
    views: row.views,
    reading_time: row.reading_time,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    author: row.author ?? STAFF_AUTHOR,
    category: row.category,
    tags: (row.post_tags ?? []).map((pt) => pt.tag).filter((t): t is Tag => Boolean(t)),
  }
}

export const toPost = (row: Row): Post => ({ ...toSummary(row), content: row.content ?? "" })

function db() {
  return createPublicClient()
}

/** Base query for live posts. */
function livePosts(columns: string, options?: { count?: "exact" }) {
  return db()
    .from("posts")
    .select(columns, options)
    .in("status", ["published", "scheduled"])
    .lte("published_at", new Date().toISOString())
}

export const getSiteSettings = cache(async () => {
  const { data } = await db().from("site_settings").select("*").eq("id", 1).maybeSingle()
  return {
    site_name: data?.site_name ?? siteConfig.name,
    site_description: data?.site_description ?? siteConfig.description,
    logo_url: data?.logo_url ?? null,
    posts_per_page: data?.posts_per_page ?? DEFAULT_POSTS_PER_PAGE,
    social_links: (data?.social_links ?? {}) as Record<string, string>,
  }
})

type PostFilter = {
  page?: number
  perPage?: number
  sort?: SortOrder
  category?: string
  tag?: string
  author?: string
  exclude?: string[]
}

const EMPTY: Paginated<PostSummary> = { items: [], page: 1, totalPages: 1, total: 0 }

export async function getPosts(filter: PostFilter = {}): Promise<Paginated<PostSummary>> {
  const perPage = filter.perPage ?? (await getSiteSettings()).posts_per_page
  const page = Math.max(1, filter.page ?? 1)
  let query = livePosts(SUMMARY_COLUMNS, { count: "exact" })

  if (filter.category) {
    const category = await getCategoryBySlug(filter.category)
    if (!category) return EMPTY
    query = query.eq("category_id", category.id)
  }
  if (filter.author) {
    const author = await getAuthorByUsername(filter.author)
    if (!author) return EMPTY
    query = query.eq("author_id", author.id)
  }
  if (filter.tag) {
    const tag = await getTagBySlug(filter.tag)
    if (!tag) return EMPTY
    const { data: links } = await db().from("post_tags").select("post_id").eq("tag_id", tag.id)
    const ids = (links ?? []).map((l) => l.post_id)
    if (!ids.length) return EMPTY
    query = query.in("id", ids)
  }
  if (filter.exclude?.length) query = query.not("id", "in", `(${filter.exclude.join(",")})`)

  query =
    filter.sort === "popular"
      ? query.order("views", { ascending: false }).order("published_at", { ascending: false })
      : query.order("published_at", { ascending: false })

  const from = (page - 1) * perPage
  const { data, count, error } = await query.range(from, from + perPage - 1)
  if (error) throw error

  const total = count ?? 0
  return { items: ((data ?? []) as unknown as Row[]).map(toSummary), page, total, totalPages: Math.max(1, Math.ceil(total / perPage)) }
}

export async function getFeaturedPosts(limit = 4): Promise<PostSummary[]> {
  const { data, error } = await livePosts(SUMMARY_COLUMNS).eq("featured", true).order("published_at", { ascending: false }).limit(limit)
  if (error) throw error
  return ((data ?? []) as unknown as Row[]).map(toSummary)
}

/** Most-read stories published in the last `days`, topped up with all-time favourites. */
export async function getTrendingPosts(limit = 4, days = 30): Promise<PostSummary[]> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString()
  const { data, error } = await livePosts(SUMMARY_COLUMNS).gte("published_at", since).order("views", { ascending: false }).limit(limit)
  if (error) throw error
  const recent = ((data ?? []) as unknown as Row[]).map(toSummary)
  if (recent.length >= limit) return recent

  const exclude = recent.map((p) => p.id)
  let fill = livePosts(SUMMARY_COLUMNS).order("views", { ascending: false }).limit(limit - recent.length)
  if (exclude.length) fill = fill.not("id", "in", `(${exclude.join(",")})`)
  const { data: more } = await fill
  return [...recent, ...((more ?? []) as unknown as Row[]).map(toSummary)]
}

export async function getPopularPosts(limit = 5): Promise<PostSummary[]> {
  const { data, error } = await livePosts(SUMMARY_COLUMNS).order("views", { ascending: false }).limit(limit)
  if (error) throw error
  return ((data ?? []) as unknown as Row[]).map(toSummary)
}

export const getPostBySlug = cache(async (slug: string): Promise<Post | null> => {
  const { data, error } = await livePosts(POST_COLUMNS).eq("slug", slug).maybeSingle()
  if (error) throw error
  return data ? toPost(data as unknown as Row) : null
})

export async function getAllPostSlugs(): Promise<{ slug: string; published_at: string | null }[]> {
  const { data } = await livePosts("slug, published_at").order("published_at", { ascending: false })
  return (data ?? []) as unknown as { slug: string; published_at: string | null }[]
}

export async function getRelatedPosts(post: PostSummary, limit = 3): Promise<PostSummary[]> {
  const related: PostSummary[] = []
  if (post.category) {
    const { data } = await livePosts(SUMMARY_COLUMNS)
      .eq("category_id", post.category.id)
      .neq("id", post.id)
      .order("published_at", { ascending: false })
      .limit(limit)
    related.push(...((data ?? []) as unknown as Row[]).map(toSummary))
  }
  // Top up with the latest posts when the section has too few.
  if (related.length < limit) {
    const exclude = [post.id, ...related.map((p) => p.id)]
    const { data } = await livePosts(SUMMARY_COLUMNS)
      .not("id", "in", `(${exclude.join(",")})`)
      .order("published_at", { ascending: false })
      .limit(limit - related.length)
    related.push(...((data ?? []) as unknown as Row[]).map(toSummary))
  }
  return related
}

export async function getAdjacentPosts(post: PostSummary): Promise<{ previous: PostSummary | null; next: PostSummary | null }> {
  if (!post.published_at) return { previous: null, next: null }
  const [older, newer] = await Promise.all([
    livePosts(SUMMARY_COLUMNS).lt("published_at", post.published_at).order("published_at", { ascending: false }).limit(1).maybeSingle(),
    livePosts(SUMMARY_COLUMNS).gt("published_at", post.published_at).order("published_at", { ascending: true }).limit(1).maybeSingle(),
  ])
  return {
    previous: older.data ? toSummary(older.data as unknown as Row) : null,
    next: newer.data ? toSummary(newer.data as unknown as Row) : null,
  }
}

export const getCategories = cache(async (): Promise<WithCount<Category>[]> => {
  const now = new Date().toISOString()
  const { data, error } = await db()
    .from("categories")
    .select("id, name, slug, description, posts(count)")
    .in("posts.status", ["published", "scheduled"])
    .lte("posts.published_at", now)
    .order("name")
  if (error) throw error
  return (data ?? []).map(({ posts, ...c }) => ({ ...c, postCount: (posts as unknown as { count: number }[])[0]?.count ?? 0 }))
})

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const { data } = await db().from("categories").select("id, name, slug, description").eq("slug", slug).maybeSingle()
  return data
})

export const getTags = cache(async (): Promise<WithCount<Tag>[]> => {
  const [{ data: tags }, { data: links }] = await Promise.all([
    db().from("tags").select("id, name, slug"),
    // Only links whose post is live (inner join + RLS on posts).
    db()
      .from("post_tags")
      .select("tag_id, post:posts!inner(id)")
      .in("post.status", ["published", "scheduled"])
      .lte("post.published_at", new Date().toISOString()),
  ])
  const counts = new Map<string, number>()
  for (const l of links ?? []) counts.set(l.tag_id, (counts.get(l.tag_id) ?? 0) + 1)
  return (tags ?? [])
    .map((t) => ({ ...t, postCount: counts.get(t.id) ?? 0 }))
    .filter((t) => t.postCount > 0)
    .sort((a, b) => b.postCount - a.postCount || a.name.localeCompare(b.name))
})

export const getTagBySlug = cache(async (slug: string): Promise<Tag | null> => {
  const { data } = await db().from("tags").select("id, name, slug").eq("slug", slug).maybeSingle()
  return data
})

export async function getAuthors(): Promise<WithCount<Author>[]> {
  const { data, error } = await db()
    .from("profiles")
    .select("id, full_name, username, avatar_url, bio, role, posts(count)")
    .in("posts.status", ["published", "scheduled"])
    .lte("posts.published_at", new Date().toISOString())
    .order("created_at")
  if (error) throw error
  return (data ?? [])
    .map(({ posts, ...a }) => ({ ...a, postCount: (posts as unknown as { count: number }[])[0]?.count ?? 0 }))
    .filter((a) => a.postCount > 0)
}

export const getAuthorByUsername = cache(async (username: string): Promise<Author | null> => {
  const { data } = await db().from("profiles").select("id, full_name, username, avatar_url, bio, role").eq("username", username).maybeSingle()
  return data
})

// ---------------------------------------------------------------------------
// Search (Postgres full-text search via the search_posts RPC)
// ---------------------------------------------------------------------------

export type SearchResult = PostSummary & { titleHtml: string; snippetHtml: string }

const SEARCH_PAGE_SIZE = 10
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
const decodeEntities = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")

/** Escapes text, then wraps matched terms in <mark>. Output is safe to render. */
function highlightTerms(text: string, terms: string[]): string {
  if (!terms.length) return escapeHtml(text)
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi")
  return text
    .split(pattern)
    .map((part, i) => (i % 2 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)))
    .join("")
}

/** ts_headline output isn't escaped: keep only its <mark> tags, escape everything else. */
function safeHeadline(headline: string): string {
  return headline
    .split(/(<\/?mark>)/)
    .map((part) => (part === "<mark>" || part === "</mark>" ? part : escapeHtml(decodeEntities(part))))
    .join("")
    .replace(/\s+/g, " ")
    .trim()
}

export async function searchPosts(query: string, page = 1): Promise<Paginated<SearchResult>> {
  const q = query.trim()
  if (!q) return { items: [], page: 1, totalPages: 1, total: 0 }
  const current = Math.max(1, page)

  const { data: hits, error } = await db().rpc("search_posts", {
    search_query: q,
    page_limit: SEARCH_PAGE_SIZE,
    page_offset: (current - 1) * SEARCH_PAGE_SIZE,
  })
  if (error) throw error
  if (!hits?.length) return { items: [], page: current, totalPages: 1, total: 0 }

  // Hydrate authors, categories and tags for the matched ids, keeping rank order.
  const { data: rows } = await livePosts(SUMMARY_COLUMNS).in(
    "id",
    hits.map((h) => h.id)
  )
  const byId = new Map(((rows ?? []) as unknown as Row[]).map((r) => [r.id, toSummary(r)]))
  const terms = q.toLowerCase().split(/\s+/).filter((t) => t.length > 1 && !["and", "or", "the"].includes(t))

  const items = hits
    .map((h) => {
      const post = byId.get(h.id)
      return post ? { ...post, titleHtml: highlightTerms(post.title, terms), snippetHtml: safeHeadline(h.headline ?? "") } : null
    })
    .filter((r): r is SearchResult => Boolean(r))

  const total = Number(hits[0].total_count)
  return { items, page: current, total, totalPages: Math.max(1, Math.ceil(total / SEARCH_PAGE_SIZE)) }
}
