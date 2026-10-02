import type { Metadata } from "next"
import { PageHeading } from "@/components/admin/page-heading"
import { TaxonomyManager } from "@/components/admin/taxonomy-manager"
import { requireUser } from "@/lib/auth"
import { getTagsWithCounts } from "@/lib/queries/admin"
import { siteOrigin } from "@/lib/urls"

export const metadata: Metadata = { title: "Tags" }

export default async function TagsPage() {
  const session = await requireUser()
  const tags = await getTagsWithCounts()

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        title="Tags"
        description={
          session.isAdmin ? "Topics that cut across categories." : "Topics that cut across categories. Add new tags from the post editor; only admins can rename or delete them."
        }
      />
      <TaxonomyManager kind="tag" items={tags} canEdit={session.isAdmin} siteBase={siteOrigin()} />
    </div>
  )
}
