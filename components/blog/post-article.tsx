import Image from "next/image"
import Link from "next/link"
import { ChevronRight, Clock, List } from "lucide-react"
import { AuthorBio } from "@/components/blog/author-bio"
import { FaqAccordion } from "@/components/blog/faq-accordion"
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
import { postPath } from "@/lib/urls"

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
  const url = absoluteUrl(postPath(post.slug))
  const authorHref = post.author.username ? `/author/${post.author.username}` : null

  // An "Updated" line only for real edits: more than an hour after publishing and
  // within 30 days of it (news updates; also guards against old view-count bumps).
  // updated_at ignores view counts and the Featured toggle (migration 20261105000000).
  const modified =
    post.updated_at && post.published_at && isRealUpdate(post.published_at, post.updated_at)
      ? post.updated_at
      : null

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.excerpt,
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    datePublished: post.published_at,
    dateModified: modified ?? post.published_at,
    inLanguage: "en-GB",
    articleSection: post.category?.name,
    author: authorHref && post.author.id !== "staff"
      ? { "@type": "Person", name: post.author.full_name, url: absoluteUrl(authorHref) }
      : { "@type": "Organization", "@id": absoluteUrl("/#organization"), name: siteConfig.name, url: absoluteUrl(authorHref ?? "/") },
    publisher: {
      "@type": "NewsMediaOrganization",
      "@id": absoluteUrl("/#organization"),
      name: siteConfig.name,
      url: absoluteUrl("/"),
      publishingPrinciples: absoluteUrl("/editorial-policy"),
      logo: { "@type": "ImageObject", url: absoluteUrl("/logo-dark.png") },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
      { "@type": "ListItem", position: 2, name: "Latest", item: absoluteUrl("/blog") },
      ...(post.category
        ? [{ "@type": "ListItem", position: 3, name: post.category.name, item: absoluteUrl(`/category/${post.category.slug}`) }]
        : []),
      { "@type": "ListItem", position: post.category ? 4 : 3, name: post.title, item: url },
    ],
  }

  // FAQPage schema, only when the story has FAQs (Google's FAQ rich results).
  const faqJsonLd = post.faqs.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      }
    : null

  return (
    <>
      <ReadingProgress targetId="article-body" />
      {!preview && (
        <script
          type="application/ld+json"
          // "<" is escaped so post text can never close the script tag.
          dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, breadcrumbJsonLd]).replace(/</g, "\\u003c") }}
        />
      )}
      {!preview && faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }} />
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
                    {modified && (
                      <>
                        <span aria-hidden>·</span>
                        <span>
                          Updated <time dateTime={modified}>{formatDate(modified, "d MMMM yyyy")}</time>
                        </span>
                      </>
                    )}
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" aria-hidden /> {post.reading_time} min read
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
            {/* Show the whole cover at its own proportions (no cropping); 16:9 is only the pre-load placeholder. */}
            <div className="overflow-hidden rounded-3xl bg-muted">
              <Image src={post.cover_image_url} alt={post.cover_image_alt || post.title} width={1600} height={900} priority fetchPriority="high" sizes="(min-width: 1280px) 1150px, 100vw" className="mx-auto h-auto max-h-[80vh] w-full object-contain" />
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

              {post.faqs.length > 0 && (
                <section aria-labelledby="faq-heading" className="mt-14">
                  <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">FAQ</p>
                  <h2 id="faq-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                    Frequently asked questions
                  </h2>
                  <FaqAccordion faqs={post.faqs} />
                </section>
              )}

              <p className="mt-10 text-sm text-muted-foreground">
                Spotted an error?{" "}
                <a href={`mailto:${siteConfig.email}?subject=${encodeURIComponent(`Correction: ${post.title}`)}`} className="font-medium text-foreground underline underline-offset-4 hover:text-brand">
                  Tell us
                </a>
                . Read how we report and correct stories in our{" "}
                <Link href="/editorial-policy" className="font-medium text-foreground underline underline-offset-4 hover:text-brand">
                  editorial policy
                </Link>
                .
              </p>

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

const HOUR = 3_600_000
function isRealUpdate(published: string, updated: string): boolean {
  const gap = Date.parse(updated) - Date.parse(published)
  return gap > HOUR && gap < 30 * 24 * HOUR
}
