import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Clock, Eye, List } from "lucide-react"
import { AuthorBio } from "@/components/blog/author-bio"
import { PostCard } from "@/components/blog/post-card"
import { AuthorAvatar, CategoryBadge } from "@/components/blog/post-meta"
import { PostBody } from "@/components/blog/post-body"
import { PostNavigation } from "@/components/blog/post-navigation"
import { ReadingProgress } from "@/components/blog/reading-progress"
import { ShareButtons } from "@/components/blog/share-buttons"
import { TagCloud } from "@/components/blog/sidebar"
import { TableOfContents } from "@/components/blog/table-of-contents"
import { Container } from "@/components/shared/container"
import { prepareContent } from "@/lib/content"
import { siteConfig } from "@/lib/site"
import { absoluteUrl, formatDate } from "@/lib/utils"
import type { Post, PostSummary } from "@/types/app"

type Props = {
  post: Post
  related: PostSummary[]
  adjacent: { previous: PostSummary | null; next: PostSummary | null }
  /** CMS preview: skips structured data. */
  preview?: boolean
}

/** Full article layout, shared by the public post page and the CMS preview. */
export function PostArticle({ post, related, adjacent, preview }: Props) {
  const { html, headings } = prepareContent(post.content)
  const url = absoluteUrl(`/blog/${post.slug}`)
  const authorHref = post.author.username ? `/author/${post.author.username}` : null

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at,
    author: authorHref
      ? { "@type": "Person", name: post.author.full_name, url: absoluteUrl(authorHref) }
      : { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name, logo: { "@type": "ImageObject", url: absoluteUrl("/logo-dark.png") } },
    mainEntityOfPage: url,
  }

  return (
    <>
      <ReadingProgress targetId="article-body" />
      {!preview && (
        <script
          type="application/ld+json"
          // "<" is escaped so post text can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}

      <article>
        <Container className="max-w-4xl pt-10 sm:pt-14">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
            <ChevronRight className="size-3.5" aria-hidden />
            <Link href="/blog" className="hover:text-foreground">
              Latest
            </Link>
            {post.category && (
              <>
                <ChevronRight className="size-3.5" aria-hidden />
                <Link href={`/category/${post.category.slug}`} className="hover:text-foreground">
                  {post.category.name}
                </Link>
              </>
            )}
          </nav>

          <header className="mt-8">
            {post.category && <CategoryBadge category={post.category} />}
            <h1 className="mt-4 text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl lg:text-[3.5rem]">{post.title}</h1>
            {post.excerpt && <p className="mt-5 text-xl leading-relaxed text-muted-foreground">{post.excerpt}</p>}

            <div className="mt-8 flex flex-wrap items-center justify-between gap-6 border-y py-5">
              <div className="flex items-center gap-3">
                <AuthorAvatar author={post.author} size={44} />
                <div className="text-sm">
                  {authorHref ? (
                    <Link href={authorHref} className="font-semibold hover:text-brand">
                      {post.author.full_name}
                    </Link>
                  ) : (
                    <span className="font-semibold">{post.author.full_name}</span>
                  )}
                  <p className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                    {post.published_at && <time dateTime={post.published_at}>{formatDate(post.published_at, "d MMMM yyyy")}</time>}
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden /> {post.reading_time} min read
                    </span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3.5" aria-hidden /> {post.views.toLocaleString("en-GB")} views
                    </span>
                  </p>
                </div>
              </div>
              <ShareButtons url={url} title={post.title} />
            </div>
          </header>
        </Container>

        {post.cover_image_url && (
          <Container className="mt-10 max-w-6xl">
            <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-muted sm:aspect-[2/1]">
              <Image src={post.cover_image_url} alt={post.title} fill priority sizes="(min-width: 1280px) 1150px, 100vw" className="object-cover" />
            </div>
          </Container>
        )}

        <Container className="mt-12 max-w-6xl sm:mt-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_240px] lg:gap-16">
            <div id="article-body" className="mx-auto w-full max-w-[720px] min-w-0">
              {headings.length > 0 && (
                <details className="mb-10 rounded-2xl border p-5 lg:hidden">
                  <summary className="flex cursor-pointer items-center gap-2 font-semibold">
                    <List className="size-4" aria-hidden /> On this page
                  </summary>
                  <TableOfContents headings={headings} className="mt-4" />
                </details>
              )}

              <PostBody html={html} />

              {post.tags.length > 0 && (
                <div className="mt-12 flex flex-wrap items-center gap-3 border-t pt-8">
                  <span className="text-sm font-medium text-muted-foreground">Tagged</span>
                  <TagCloud tags={post.tags} />
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-muted/40 px-6 py-5">
                <p className="font-semibold">Enjoyed this story? Share it.</p>
                <ShareButtons url={url} title={post.title} />
              </div>

              <div className="mt-12 flex flex-col gap-12">
                {authorHref && <AuthorBio author={post.author} />}
                <PostNavigation previous={adjacent.previous} next={adjacent.next} />
              </div>
            </div>

            {headings.length > 0 && (
              <aside className="hidden lg:block" aria-label="Table of contents">
                <div className="sticky top-24">
                  <p className="mb-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">On this page</p>
                  <TableOfContents headings={headings} />
                </div>
              </aside>
            )}
          </div>
        </Container>
      </article>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-24 border-t bg-muted/20 py-16">
          <Container>
            <h2 id="related-heading" className="text-3xl font-bold tracking-tight">
              Keep reading
            </h2>
            <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  )
}
