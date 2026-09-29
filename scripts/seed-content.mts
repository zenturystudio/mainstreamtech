// Loads the starter sections, tags and stories into Supabase.
// Run: npm run seed:content   (Node 22.18+ runs TypeScript directly.)
//
// Idempotent: categories/tags are upserted by slug, existing posts (by slug)
// are left alone. Posts are attributed to the first admin; if no account
// exists yet they are left authorless and picked up on the next run.

import { readFileSync } from "node:fs"
import { createClient } from "@supabase/supabase-js"
import { categories, posts, tags } from "./seed-data.mts"

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
)
const url = env.NEXT_PUBLIC_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local")

const db = createClient(url, key, { auth: { persistSession: false } })

function check<T>(label: string, res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(`${label}: ${res.error.message}`)
  return res.data
}

const catRows = check(
  "categories",
  await db
    .from("categories")
    .upsert(categories.map(({ name, slug, description }) => ({ name, slug, description })), { onConflict: "slug" })
    .select("id, slug")
)
const tagRows = check("tags", await db.from("tags").upsert(tags.map(({ name, slug }) => ({ name, slug })), { onConflict: "slug" }).select("id, slug"))
const catId = new Map(catRows.map((c) => [c.slug, c.id]))
const tagId = new Map(tagRows.map((t) => [t.slug, t.id]))
console.log(`✓ ${catRows.length} categories, ${tagRows.length} tags`)

const profiles = check("profiles", await db.from("profiles").select("id, role, created_at").order("created_at"))
const author = profiles.find((p) => p.role === "admin") ?? profiles[0] ?? null
console.log(author ? `✓ attributing posts to profile ${author.id}` : "! no accounts yet: posts will be authorless (re-run after creating your admin)")

const existing = new Set(check("posts", await db.from("posts").select("slug")).map((p) => p.slug))
let created = 0
for (const post of posts) {
  if (existing.has(post.slug)) continue
  const row = check(
    `post ${post.slug}`,
    await db
      .from("posts")
      .insert({
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content.trim(),
        cover_image_url: post.cover_image_url,
        status: "published",
        published_at: post.published_at,
        featured: post.featured,
        views: post.views,
        reading_time: post.reading_time,
        category_id: post.category ? (catId.get(post.category.slug) ?? null) : null,
        author_id: author?.id ?? null,
      })
      .select("id")
      .single()
  )
  const links = post.tags.map((t) => ({ post_id: row.id, tag_id: tagId.get(t.slug)! })).filter((l) => l.tag_id)
  if (links.length) check(`tags for ${post.slug}`, await db.from("post_tags").insert(links))
  created++
}
console.log(`✓ ${created} posts created, ${posts.length - created} already existed`)

if (author) {
  const adopted = check(
    "adopt",
    await db
      .from("posts")
      .update({ author_id: author.id })
      .is("author_id", null)
      .in(
        "slug",
        posts.map((p) => p.slug)
      )
      .select("id")
  )
  if (adopted.length) console.log(`✓ assigned ${adopted.length} authorless starter posts to your account`)
}
