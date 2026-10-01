import type { Metadata } from "next"
import { EmptyState, PageHeader } from "@/components/blog/page-header"
import { PostGrid } from "@/components/blog/post-card"
import { SortTabs } from "@/components/blog/sort-tabs"
import { Container } from "@/components/shared/container"
import { Pagination } from "@/components/shared/pagination"
import { getPosts, type SortOrder } from "@/lib/queries/public"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Blog",
  description: "Every story on Mainstream Tech: technology, AI, business, politics and international news.",
  alternates: { canonical: "/blog" },
}

type Props = { searchParams: Promise<{ page?: string; sort?: string }> }

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams
  const sort: SortOrder = params.sort === "popular" ? "popular" : "latest"
  const result = await getPosts({ page: Number(params.page) || 1, sort })

  return (
    <Container>
      <PageHeader
        eyebrow="Latest"
        title="All stories"
        description="News, explainers and analysis from the Mainstream Tech newsroom."
      >
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <SortTabs basePath="/blog" current={sort} />
          <p className="text-sm text-muted-foreground">{result.total} articles</p>
        </div>
      </PageHeader>

      <div className="pt-12">
        {result.items.length ? <PostGrid posts={result.items} headingAs="h2" /> : <EmptyState title="No articles yet" description="Check back soon." />}
      </div>

      <div className="mt-16">
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          basePath="/blog"
          params={{ sort: sort === "popular" ? "popular" : undefined }}
        />
      </div>
    </Container>
  )
}
