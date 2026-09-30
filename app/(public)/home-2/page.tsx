import type { Metadata } from "next"
import { EmptyState } from "@/components/blog/page-header"
import { CardRow, HeroBand, PicksMosaic, SectionTitle, StoryGrid } from "@/components/home-v2/blocks"
import { LeadWithList } from "@/components/home-v2/lead-with-list"
import { SectionTabs } from "@/components/home-v2/section-tabs"
import { Container } from "@/components/shared/container"
import { NewsletterForm } from "@/components/shared/newsletter-form"
import { getCategories, getFeaturedPosts, getPosts, getTrendingPosts } from "@/lib/queries/public"

export const revalidate = 300

// Alternative homepage design. Canonical points at "/" so the two versions
// don't compete in search results.
export const metadata: Metadata = {
  title: "Home 2",
  alternates: { canonical: "/" },
}

export default async function HomeV2Page() {
  const [featured, latest, trending, categories, business, international] = await Promise.all([
    getFeaturedPosts(5),
    getPosts({ perPage: 12 }),
    getTrendingPosts(4),
    getCategories(),
    getPosts({ category: "business", perPage: 4 }),
    getPosts({ category: "international", perPage: 3 }),
  ])

  // Lead = newest featured story, else the latest.
  const lead = featured[0] ?? latest.items[0]
  if (!lead) {
    return (
      <Container className="py-16">
        <EmptyState title="No stories yet" description="Published stories will appear here." />
      </Container>
    )
  }
  // Picks: remaining featured stories first, topped up with the latest.
  const picks = [...featured, ...latest.items].filter((p, i, all) => p.id !== lead.id && all.findIndex((q) => q.id === p.id) === i).slice(0, 5)

  const tabs = (
    await Promise.all(
      categories
        .filter((c) => c.postCount > 0)
        .map(async (c) => ({ slug: c.slug, name: c.name, posts: (await getPosts({ category: c.slug, perPage: 5 })).items }))
    )
  ).filter((t) => t.posts.length > 0)

  return (
    <>
      <HeroBand lead={lead} />

      <Container className="flex flex-col gap-20 pt-16 sm:pt-20">
        <PicksMosaic posts={picks} />
        <SectionTabs tabs={tabs} />

        {business.items.length > 0 && (
          <section aria-labelledby="business-heading">
            <SectionTitle id="business-heading" title="Business News" />
            <LeadWithList posts={business.items} moreHref="/category/business" moreLabel="More Business" />
          </section>
        )}

        {international.items.length > 0 && (
          <section aria-labelledby="international-heading">
            <SectionTitle id="international-heading" title="International News" moreHref="/category/international" />
            <CardRow posts={international.items} />
          </section>
        )}

        <StoryGrid id="trending-heading" title="Trending" posts={trending} moreHref="/blog?sort=popular" />
      </Container>

      <section aria-labelledby="v2-newsletter" className="mt-20 bg-foreground text-background">
        <Container className="flex flex-col gap-6 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 id="v2-newsletter" className="text-3xl font-bold tracking-tight">
              The weekly briefing
            </h2>
            <p className="mt-2 text-background/70">The week&apos;s most important stories, every Friday.</p>
          </div>
          <NewsletterForm
            id="v2-newsletter-form"
            className="md:max-w-md [&_button]:bg-background [&_button]:text-foreground [&_button:hover]:bg-background/90 [&_input]:border-background/25 [&_input]:bg-background/10 [&_input]:text-background [&_input]:placeholder:text-background/50"
          />
        </Container>
      </section>
    </>
  )
}
