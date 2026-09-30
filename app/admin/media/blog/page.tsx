import type { Metadata } from "next"
import { MediaLibrary } from "@/components/admin/media-library"
import { MediaTabs } from "@/components/admin/media-tabs"
import { PageHeading } from "@/components/admin/page-heading"
import { requireUser } from "@/lib/auth"
import { listMedia } from "@/lib/queries/media"

export const metadata: Metadata = { title: "Blog media" }

export default async function BlogMediaPage() {
  const session = await requireUser()
  const items = await listMedia(session, "blog")

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading
        title="Blog media"
        description="Images for blog posts only: uploads here, plus cover images and images added in the post editor."
        className="mb-4"
      />
      <MediaTabs current="blog" />
      <MediaLibrary items={items} userId={session.user.id} isAdmin={session.isAdmin} folder="blog" />
    </div>
  )
}
