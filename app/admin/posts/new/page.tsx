import type { Metadata } from "next"
import { PostEditor } from "@/components/admin/editor/post-editor"
import { requireUser } from "@/lib/auth"
import { getTaxonomyOptions } from "@/lib/queries/taxonomy"
import { siteOrigin } from "@/lib/urls"

export const metadata: Metadata = { title: "New post" }

export default async function NewPostPage() {
  await requireUser()
  const { categories, tags } = await getTaxonomyOptions()

  return (
    <PostEditor
      categories={categories}
      tags={tags}
      siteBase={siteOrigin()}
      post={{
        id: null,
        title: "",
        slug: "",
        excerpt: "",
        content: "",
        cover_image_url: null,
        status: "draft",
        published_at: null,
        category_id: "",
        tag_ids: [],
        featured: false,
        meta_title: "",
        meta_description: "",
        faqs: [],
        updated_at: null,
      }}
    />
  )
}
