import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { EmptyState } from "@/components/blog/page-header"
import { PostGrid } from "@/components/blog/post-card"
import { AuthorAvatar } from "@/components/blog/post-meta"
import { Container } from "@/components/shared/container"
import { Pagination } from "@/components/shared/pagination"
import { SocialLinks } from "@/components/shared/social-links"
import { getAuthorByUsername, getPosts } from "@/lib/queries/public"

// Rendered per request: it reads ?page=, which a pre-built (static) page can't.
export const dynamic = "force-dynamic"

type Props = { params: Promise<{ username: string }>; searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const author = await getAuthorByUsername((await params).username)
  if (!author) return {}
  return {
    title: author.full_name ?? author.username ?? "Author",
    description: author.bio ?? undefined,
    alternates: { canonical: `/author/${author.username}` },
  }
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const [{ username }, { page }] = await Promise.all([params, searchParams])
  const author = await getAuthorByUsername(username)
  if (!author) notFound()

  const result = await getPosts({ author: username, page: Number(page) || 1 })

  return (
    <Container>
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

      <h2 className="mt-12 text-2xl font-bold tracking-tight">Articles by {author.full_name?.split(" ")[0]}</h2>
      <div className="pt-8">
        {result.items.length ? <PostGrid posts={result.items} /> : <EmptyState title="No articles yet" />}
      </div>
      <div className="mt-16">
        <Pagination page={result.page} totalPages={result.totalPages} basePath={`/author/${username}`} />
      </div>
    </Container>
  )
}
