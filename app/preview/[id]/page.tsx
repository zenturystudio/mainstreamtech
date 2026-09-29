import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Eye, Pencil } from "lucide-react"
import { PostArticle } from "@/components/blog/post-article"
import { StatusBadge } from "@/components/admin/status-badge"
import { Header } from "@/components/shared/header"
import { Footer } from "@/components/shared/footer"
import { requireUser } from "@/lib/auth"
import type { PostStatus } from "@/lib/posts"
import { getRelatedPosts, STAFF_AUTHOR } from "@/lib/queries/public"
import { createClient } from "@/lib/supabase/server"
import type { Post, Tag } from "@/types/app"

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } }
export const dynamic = "force-dynamic"

/** Renders any post (including drafts) exactly as readers will see it. Owners and admins only. */
export default async function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, requireUser()])
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const supabase = await createClient()
  const { data } = await supabase
    .from("posts")
    .select(
      "id, title, slug, excerpt, content, cover_image_url, status, published_at, featured, views, reading_time, meta_title, meta_description, author_id, author:profiles(id, full_name, username, avatar_url, bio, role), category:categories(id, name, slug, description), post_tags(tag:tags(id, name, slug))"
    )
    .eq("id", id)
    .maybeSingle()
  if (!data || (!session.isAdmin && data.author_id !== session.user.id)) notFound()

  const post: Post = {
    ...data,
    status: data.status as PostStatus,
    author: data.author ?? STAFF_AUTHOR,
    category: data.category,
    tags: (data.post_tags ?? []).map((pt) => pt.tag).filter((t): t is Tag => Boolean(t)),
    // Drafts have no date yet; show today's so the byline renders as it will.
    published_at: data.published_at ?? new Date().toISOString(),
  }
  const related = await getRelatedPosts(post, 3)

  return (
    <div className="flex min-h-svh flex-col">
      <div className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-3 bg-foreground px-4 py-2 text-sm text-background">
        <Eye className="size-4" aria-hidden />
        <span>Preview: this is how the story will look.</span>
        <StatusBadge status={data.status as PostStatus} publishedAt={data.published_at} />
        <Link href={`/admin/posts/${data.id}/edit`} className="inline-flex items-center gap-1 font-medium underline underline-offset-4">
          <Pencil className="size-3.5" aria-hidden /> Back to editor
        </Link>
      </div>
      <Header />
      <main id="main" className="flex-1">
        <PostArticle post={post} related={related} adjacent={{ previous: null, next: null }} preview />
      </main>
      <Footer />
    </div>
  )
}
