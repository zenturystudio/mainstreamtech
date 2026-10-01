import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Search } from "lucide-react"
import { EmptyState } from "@/components/blog/page-header"
import { CategoryBadge } from "@/components/blog/post-meta"
import { TagCloud } from "@/components/blog/sidebar"
import { Container } from "@/components/shared/container"
import { Pagination } from "@/components/shared/pagination"
import { getTags, searchPosts } from "@/lib/queries/public"
import { formatDate } from "@/lib/utils"
import { postPath } from "@/lib/urls"

type Props = { searchParams: Promise<{ q?: string; page?: string }> }

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: q ? `Search: ${q}` : "Search",
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", page } = await searchParams
  const query = q.trim().slice(0, 100)
  const [result, tags] = await Promise.all([searchPosts(query, Number(page) || 1), getTags()])

  return (
    <Container className="max-w-4xl">
      <header className="pt-12 pb-10 sm:pt-16">
        <p className="font-mono text-xs tracking-widest text-brand uppercase">Search</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
          {query ? (
            <>
              Results for <span className="text-brand">&ldquo;{query}&rdquo;</span>
            </>
          ) : (
            "Search articles"
          )}
        </h1>
        {/* Plain GET form: works without JavaScript. */}
        <form action="/search" role="search" className="relative mt-8">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Try “AI”, “elections” or “markets”"
            aria-label="Search articles"
            className="h-14 w-full rounded-2xl border bg-background pr-32 pl-12 text-lg outline-none focus:border-ring focus:ring-3 focus:ring-ring/30"
          />
          <button
            type="submit"
            className="absolute top-1/2 right-2 h-10 -translate-y-1/2 rounded-xl bg-foreground px-5 text-sm font-medium text-background hover:bg-foreground/85"
          >
            Search
          </button>
        </form>
        {query && (
          <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
            {result.total} {result.total === 1 ? "result" : "results"}
          </p>
        )}
      </header>

      {!query ? (
        <section className="border-t pt-10">
          <h2 className="mb-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">Browse by topic</h2>
          <TagCloud tags={tags} />
        </section>
      ) : result.items.length === 0 ? (
        <EmptyState title="No matches found" description={`We couldn't find anything for “${query}”. Check the spelling or try a broader term.`}>
          <TagCloud tags={tags} />
        </EmptyState>
      ) : (
        <>
          <ol className="flex flex-col divide-y border-t">
            {result.items.map((post) => (
              <li key={post.id} className="group relative flex gap-6 py-8">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    {post.category && <CategoryBadge category={post.category} />}
                    {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at)}</time>}
                  </div>
                  <h2 className="mt-3 text-xl font-semibold tracking-tight [&_mark]:rounded [&_mark]:bg-brand/15 [&_mark]:px-0.5 [&_mark]:text-foreground">
                    <Link
                      href={postPath(post.slug)}
                      className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4"
                      // titleHtml is escaped text plus <mark> tags (see searchPosts).
                      dangerouslySetInnerHTML={{ __html: post.titleHtml }}
                    />
                  </h2>
                  <p
                    className="mt-2 line-clamp-3 text-muted-foreground [&_mark]:rounded [&_mark]:bg-yellow-300/40 [&_mark]:px-0.5 [&_mark]:text-foreground dark:[&_mark]:bg-yellow-400/25"
                    dangerouslySetInnerHTML={{ __html: post.snippetHtml }}
                  />
                </div>
                {post.cover_image_url && (
                  <div className="relative hidden aspect-[4/3] w-40 shrink-0 overflow-hidden rounded-xl bg-muted sm:block">
                    <Image src={post.cover_image_url} alt="" fill sizes="160px" className="object-cover" />
                  </div>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-12">
            <Pagination page={result.page} totalPages={result.totalPages} basePath="/search" params={{ q: query }} />
          </div>
        </>
      )}
    </Container>
  )
}
