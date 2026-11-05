import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { EmptyState } from "@/components/blog/page-header"
import { PostGrid } from "@/components/blog/post-card"
import { AuthorAvatar } from "@/components/blog/post-meta"
import { Container } from "@/components/shared/container"
import { JsonLd } from "@/components/shared/json-ld"
import { Pagination } from "@/components/shared/pagination"
import { SocialLinks } from "@/components/shared/social-links"
import { getAuthorByUsername, getPosts } from "@/lib/queries/public"
import { absoluteUrl } from "@/lib/utils"

// Rendered per request: it reads ?page=, which a pre-built (static) page can't.
export const dynamic = "force-dynamic"

type Props = { params: Promise<{ username: string }>; searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const [author, { page }] = await Promise.all([getAuthorByUsername((await params).username), searchParams])
  if (!author) notFound()
  return {
    // The staff byline shares the site name, which made "Mainstream Tech | Mainstream Tech".
    title: author.id === "staff" ? "Newsroom" : (author.full_name ?? author.username ?? "Author"),
    description: author.bio ?? undefined,
    alternates: { canonical: `/author/${author.username}` },
    // Page 2+ only repeats the listing: keep it out of Google.
    ...(Number(page) > 1 ? { robots: { index: false, follow: true } } : {}),
  }
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const [{ username }, { page }] = await Promise.all([params, searchParams])
  const author = await getAuthorByUsername(username)
  if (!author) notFound()

  const result = await getPosts({ author: username, page: Number(page) || 1 })

  const pageUrl = absoluteUrl(`/author/${author.username}`)
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      url: pageUrl,
      mainEntity:
        author.id === "staff"
          ? { "@type": "NewsMediaOrganization", "@id": absoluteUrl("/#organization"), name: author.full_name, url: absoluteUrl("/") }
          : { "@type": "Person", name: author.full_name, url: pageUrl, description: author.bio ?? undefined, image: author.avatar_url ?? undefined },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        { "@type": "ListItem", position: 2, name: author.full_name ?? "Author", item: pageUrl },
      ],
    },
  ]

  return (
    <Container>
      <JsonLd data={jsonLd} />
      <header className="flex flex-col gap-8 border-b pt-12 pb-12 sm:flex-row sm:items-center sm:pt-16">
        <AuthorAvatar author={author} size={120} className="ring-4 ring-muted" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs tracking-widest text-brand uppercase">{author.title ?? "Author"}</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">{author.full_name}</h1>
          {author.bio && <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{author.bio}</p>}
          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-4">
            <dl className="flex gap-8">
              <div>
                <dt className="text-sm text-muted-foreground">Articles</dt>
                <dd className="text-2xl font-semibold tabular-nums">{result.total}</dd>
              </div>
            </dl>
            <SocialLinks />
          </div>
        </div>
      </header>

      <h2 className="mt-12 text-2xl font-bold tracking-tight">{author.id === "staff" ? `Articles from the ${author.title?.toLowerCase() ?? "newsroom"}` : `Articles by ${author.full_name?.split(" ")[0]}`}</h2>
      <div className="pt-8">
        {result.items.length ? <PostGrid posts={result.items} /> : <EmptyState title="No articles yet" />}
      </div>
      <div className="mt-16">
        <Pagination page={result.page} totalPages={result.totalPages} basePath={`/author/${username}`} />
      </div>
    </Container>
  )
}
