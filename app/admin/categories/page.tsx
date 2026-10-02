import type { Metadata } from "next"
import { PageHeading } from "@/components/admin/page-heading"
import { TaxonomyManager } from "@/components/admin/taxonomy-manager"
import { requireUser } from "@/lib/auth"
import { getCategoriesWithCounts } from "@/lib/queries/admin"
import { siteOrigin } from "@/lib/urls"

export const metadata: Metadata = { title: "Categories" }

export default async function CategoriesPage() {
  const session = await requireUser()
  const categories = await getCategoriesWithCounts()

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        title="Categories"
        description={session.isAdmin ? "The categories of the site. Every post belongs to one." : "The categories of the site. Only admins can change them."}
      />
      <TaxonomyManager kind="category" items={categories} canEdit={session.isAdmin} siteBase={siteOrigin()} />
    </div>
  )
}
