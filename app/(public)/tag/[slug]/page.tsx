import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { EmptyState, PageHeader } from "@/components/blog/page-header"
import { PostGrid } from "@/components/blog/post-card"
import { TagCloud } from "@/components/blog/sidebar"
import { Container } from "@/components/shared/container"
import { Pagination } from "@/components/shared/pagination"
import { getPosts, getTagBySlug, getTags } from "@/lib/queries/public"

export const revalidate = 300

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }

export async function generateStaticParams() {
  return (await getTags()).map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = await getTagBySlug((await params).slug)
  if (!tag) return {}
  return {
    title: `#${tag.name}`,
    description: `Articles tagged ${tag.name} on Mainstream Tech.`,
    alternates: { canonical: `/tag/${tag.slug}` },
  }
}

export default async function TagPage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams])
  const tag = await getTagBySlug(slug)
  if (!tag) notFound()

  const [result, tags] = await Promise.all([getPosts({ tag: slug, page: Number(page) || 1 }), getTags()])

  return (
    <Container>
      <PageHeader
        eyebrow="Tag"
        title={
          <>
            <span className="text-muted-foreground/60">#</span>
            {tag.name}
          </>
        }
        description={`${result.total} ${result.total === 1 ? "article" : "articles"} tagged ${tag.name}.`}
      >
        <div className="mt-8">
          <TagCloud tags={tags} activeSlug={slug} />
        </div>
      </PageHeader>

      <div className="pt-12">
        {result.items.length ? (
          <PostGrid posts={result.items} />
        ) : (
          <EmptyState title="No articles with this tag" description="Try one of the other topics above." />
        )}
      </div>
      <div className="mt-16">
        <Pagination page={result.page} totalPages={result.totalPages} basePath={`/tag/${slug}`} />
      </div>
    </Container>
  )
}
