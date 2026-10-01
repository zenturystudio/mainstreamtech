import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FeaturedHero } from "@/components/blog/featured-hero"
import { TrendingSection } from "@/components/blog/trending-section"
import { PostCard } from "@/components/blog/post-card"
import { CategoryList, NewsletterCard, PopularPosts, SidebarSection, TagCloud } from "@/components/blog/sidebar"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/shared/container"
import { getCategories, getFeaturedPosts, getPopularPosts, getPosts, getTags, getTrendingPosts } from "@/lib/queries/public"
import { siteConfig } from "@/lib/site"
import { absoluteUrl } from "@/lib/utils"

export const revalidate = 300

export const metadata: Metadata = { alternates: { canonical: "/" } }

// Site-level structured data: WebSite (with sitelinks search box) + Organization.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      url: absoluteUrl("/"),
      name: siteConfig.name,
      description: siteConfig.description,
      inLanguage: "en-GB",
      publisher: { "@id": absoluteUrl("/#organization") },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${absoluteUrl("/search")}?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "NewsMediaOrganization",
      "@id": absoluteUrl("/#organization"),
      name: siteConfig.name,
      url: absoluteUrl("/"),
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo-dark.png") },
      email: siteConfig.email,
    },
  ],
}

// One lead card + a 2×4 grid. The full, paginated list lives on /blog.
const LATEST_COUNT = 9

export default async function HomePage() {
  const [featured, trending, categories, popular, tags] = await Promise.all([
    getFeaturedPosts(4),
    getTrendingPosts(4),
    getCategories(),
    getPopularPosts(5),
    getTags(),
  ])
  const [lead, ...picks] = featured
  const latest = await getPosts({ perPage: LATEST_COUNT, exclude: lead ? [lead.id] : [] })
  const [first, ...rest] = latest.items

  return (
    <Container className="pt-8 sm:pt-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd).replace(/</g, "\\u003c") }} />
      {/* One h1 per page for search engines and screen readers; the design leads with the hero instead. */}
      <h1 className="sr-only">
        {siteConfig.name}: {siteConfig.tagline}
      </h1>
      {lead && <FeaturedHero lead={lead} picks={picks} />}
      <TrendingSection posts={trending} />

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

          {latest.total > latest.items.length && (
            <div className="mt-14 flex justify-center">
              <Button asChild variant="outline" size="lg" className="h-11 px-6">
                <Link href="/blog">
                  View all stories <ArrowRight />
                </Link>
              </Button>
            </div>
          )}
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
