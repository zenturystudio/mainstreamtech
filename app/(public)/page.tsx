import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FeaturedHero } from "@/components/blog/featured-hero"
import { TrendingSection } from "@/components/blog/trending-section"
import { PostCard } from "@/components/blog/post-card"
import { CategoryList, NewsletterCard, PopularPosts, SidebarSection, TagCloud } from "@/components/blog/sidebar"
import { Container } from "@/components/shared/container"
import { Pagination } from "@/components/shared/pagination"
import { getCategories, getFeaturedPosts, getPopularPosts, getPosts, getTags, getTrendingPosts } from "@/lib/queries/public"

export const revalidate = 300

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const page = Number(pageParam) || 1

  const [featured, trending, categories, popular, tags] = await Promise.all([
    getFeaturedPosts(4),
    page === 1 ? getTrendingPosts(4) : Promise.resolve([]),
    getCategories(),
    getPopularPosts(5),
    getTags(),
  ])
  const [lead, ...picks] = featured
  const latest = await getPosts({ page, exclude: page === 1 && lead ? [lead.id] : [] })
  const [first, ...rest] = latest.items

  return (
    <Container className="pt-8 sm:pt-12">
      {page === 1 && lead && <FeaturedHero lead={lead} picks={picks} />}
      {page === 1 && <TrendingSection posts={trending} />}

      <div className="mt-16 grid gap-12 sm:mt-20 lg:grid-cols-12 lg:gap-12">
        <section aria-labelledby="latest-heading" className="lg:col-span-8">
          <div className="mb-8 flex items-end justify-between gap-4 border-b pb-4">
            <div>
              <p className="font-mono text-xs tracking-widest text-brand uppercase">Fresh off the press</p>
              <h2 id="latest-heading" className="mt-1 text-3xl font-bold tracking-tight">
                Latest articles
              </h2>
            </div>
            <Link href="/blog" className="hidden items-center gap-1 text-sm font-medium hover:text-brand sm:inline-flex">
              View all <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          {first && <PostCard post={first} variant="horizontal" className="mb-12" />}
          <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2">
            {rest.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>

          <div className="mt-14">
            <Pagination page={latest.page} totalPages={latest.totalPages} basePath="/" />
          </div>
        </section>

        <aside className="flex flex-col gap-6 lg:col-span-4" aria-label="Sidebar">
          <SidebarSection title="Categories">
            <CategoryList categories={categories} />
          </SidebarSection>
          <SidebarSection title="Most read (all time)">
            <PopularPosts posts={popular} />
          </SidebarSection>
          <div className="flex flex-col gap-6 lg:sticky lg:top-24">
            <NewsletterCard />
            <SidebarSection title="Topics">
              <TagCloud tags={tags} />
            </SidebarSection>
          </div>
        </aside>
      </div>
    </Container>
  )
}
