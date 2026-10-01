import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PostEditor } from "@/components/admin/editor/post-editor"
import { requireUser } from "@/lib/auth"
import type { PostStatus } from "@/lib/posts"
import { parseFaqs } from "@/lib/faqs"
import { getPostForEdit } from "@/lib/queries/admin"
import { getTaxonomyOptions } from "@/lib/queries/taxonomy"
import { siteOrigin } from "@/lib/urls"

export const metadata: Metadata = { title: "Edit post" }

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, requireUser()])
  // Not a UUID → can't exist; avoid a Postgres cast error.
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  const [post, { categories, tags }] = await Promise.all([getPostForEdit(session, id), getTaxonomyOptions()])
  if (!post) notFound()

  return (
    <PostEditor
      // Remount when switching posts so editor state never leaks between them.
      key={post.id}
      categories={categories}
      tags={tags}
      siteBase={siteOrigin()}
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt ?? "",
        content: post.content,
        cover_image_url: post.cover_image_url,
        status: post.status as PostStatus,
        published_at: post.published_at,
        category_id: post.category_id ?? "",
        tag_ids: post.tagIds,
        featured: post.featured,
        meta_title: post.meta_title ?? "",
        meta_description: post.meta_description ?? "",
        faqs: parseFaqs(post.faqs),
        updated_at: post.updated_at,
      }}
    />
  )
}
