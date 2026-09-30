import type { Metadata } from "next"
import { EmptyState } from "@/components/blog/page-header"
import { FrontPage, JustIn, SectionColumns } from "@/components/home-v3/blocks"
import { Container } from "@/components/shared/container"
import { getCategories, getFeaturedPosts, getPosts, getTrendingPosts } from "@/lib/queries/public"

export const revalidate = 300

// Alternative homepage design (broadsheet). Canonical points at "/" so the
// versions don't compete in search results.
export const metadata: Metadata = {
  title: "Home 3",
  alternates: { canonical: "/" },
}

export default async function HomeV3Page() {
  const [featured, latest, mostRead, categories] = await Promise.all([
    getFeaturedPosts(1),
    getPosts({ perPage: 10 }),
    getTrendingPosts(5),
    getCategories(),
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
  const others = latest.items.filter((p) => p.id !== lead.id)
  const top = others.slice(0, 4)
  const justIn = others.slice(4, 8)

  const sections = (
    await Promise.all(
      [...categories]
        .filter((c) => c.postCount > 0)
        .sort((a, b) => b.postCount - a.postCount)
        .map(async (c) => ({ slug: c.slug, name: c.name, posts: (await getPosts({ category: c.slug, perPage: 4 })).items }))
    )
  ).filter((s) => s.posts.length > 0)

  return (
    <Container className="flex flex-col gap-14 pt-8 sm:pt-12">
      <FrontPage lead={lead} top={top} mostRead={mostRead.filter((p) => p.id !== lead.id).slice(0, 4)} />
      <JustIn posts={justIn} />
      <SectionColumns sections={sections} />
    </Container>
  )
}
