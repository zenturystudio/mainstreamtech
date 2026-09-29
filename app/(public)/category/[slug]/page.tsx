import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { EmptyState, PageHeader } from "@/components/blog/page-header"
import { PostGrid } from "@/components/blog/post-card"
import { Container } from "@/components/shared/container"
import { Pagination } from "@/components/shared/pagination"
import { getCategories, getCategoryBySlug, getPosts } from "@/lib/queries/public"
import { cn } from "@/lib/utils"

export const revalidate = 300

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }

export async function generateStaticParams() {
  return (await getCategories()).map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug)
  if (!category) return {}
  return {
    title: category.name,
    description: category.description ?? undefined,
    alternates: { canonical: `/category/${category.slug}` },
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ slug }, { page }] = await Promise.all([params, searchParams])
  const category = await getCategoryBySlug(slug)
  if (!category) notFound()

  const [result, categories] = await Promise.all([getPosts({ category: slug, page: Number(page) || 1 }), getCategories()])

  return (
    <Container>
      <PageHeader eyebrow="Category" title={category.name} description={category.description}>
        <nav aria-label="Categories" className="mt-8 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/category/${c.slug}`}
              aria-current={c.slug === slug ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                c.slug === slug ? "border-foreground bg-foreground text-background" : "hover:bg-muted"
              )}
            >
              {c.name}
              <span className={cn("text-xs tabular-nums", c.slug === slug ? "text-background/70" : "text-muted-foreground")}>{c.postCount}</span>
            </Link>
          ))}
        </nav>
      </PageHeader>

      <div className="pt-12">
        {result.items.length ? (
          <PostGrid posts={result.items} />
        ) : (
          <EmptyState title="Nothing here yet" description={`We haven't published anything in ${category.name} yet.`} />
        )}
      </div>
      <div className="mt-16">
        <Pagination page={result.page} totalPages={result.totalPages} basePath={`/category/${slug}`} />
      </div>
    </Container>
  )
}
