import type { Metadata } from "next"
import { MediaLibrary } from "@/components/admin/media-library"
import { MediaTabs } from "@/components/admin/media-tabs"
import { PageHeading } from "@/components/admin/page-heading"
import { requireUser } from "@/lib/auth"
import { listMedia } from "@/lib/queries/media"

export const metadata: Metadata = { title: "Media" }

export default async function MediaPage() {
  const session = await requireUser()
  const items = await listMedia(session)

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeading title="Media" description={session.isAdmin ? "Every image uploaded to the site." : "Images you've uploaded."} className="mb-4" />
      <MediaTabs current="all" />
      <MediaLibrary items={items} userId={session.user.id} isAdmin={session.isAdmin} folder="general" showFolder />
    </div>
  )
}
