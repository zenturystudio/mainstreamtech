import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { formatDate, timeAgo } from "@/lib/utils"
import type { PostSummary } from "@/types/app"

// Homepage version 3: classic broadsheet front page in black & grey.

const href = (post: PostSummary) => `/blog/${post.slug}`

function ColumnLabel({ id, children }: { id?: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="mb-4 border-b-2 border-foreground pb-2 font-sans text-xs font-bold tracking-[0.18em] uppercase">
      {children}
    </h2>
  )
}

/** Three columns: text-only top stories · lead story (image first) · most read. */
export function FrontPage({ lead, top, mostRead }: { lead: PostSummary; top: PostSummary[]; mostRead: PostSummary[] }) {
  return (
    <section aria-label="Front page" className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.2fr)_minmax(0,1fr)] lg:gap-0 lg:divide-x">
      {/* Lead first in the DOM so it comes first on phones and for screen readers. */}
      <article className="group relative lg:order-2 lg:px-8">
        <div className="relative aspect-[3/2] overflow-hidden bg-muted">
          {lead.cover_image_url && (
            <Image src={lead.cover_image_url} alt="" fill priority sizes="(min-width: 1280px) 640px, (min-width: 1024px) 52vw, 100vw" className="object-cover" />
          )}
        </div>
        {lead.category && <p className="mt-5 font-sans text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase">{lead.category.name}</p>}
        <h1 className="mt-2 text-4xl leading-[1.08] font-bold tracking-tight sm:text-5xl">
          <Link href={href(lead)} className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-2 group-hover:underline-offset-[6px]">
            {lead.title}
          </Link>
        </h1>
        {lead.excerpt && <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{lead.excerpt}</p>}
        <p className="mt-4 text-sm text-muted-foreground">
          By <span className="font-medium text-foreground">{lead.author.full_name}</span>
          {lead.published_at && <> · {formatDate(lead.published_at, "d MMMM yyyy")}</>} · {lead.reading_time} min read
        </p>
      </article>

      <div className="lg:order-1 lg:pr-8">
        <ColumnLabel id="top-stories">Top Stories</ColumnLabel>
        <ul className="flex flex-col divide-y" aria-labelledby="top-stories">
          {top.map((post) => (
            <li key={post.id} className="py-4 first:pt-0">
              <article className="group relative">
                <h3 className="text-lg leading-snug font-bold">
                  <Link href={href(post)} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
                    {post.title}
                  </Link>
                </h3>
                {post.excerpt && <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>}
              </article>
            </li>
          ))}
        </ul>
      </div>

      <div className="lg:order-3 lg:pl-8">
        <ColumnLabel id="most-read">Most Read</ColumnLabel>
        <ul className="flex flex-col divide-y" aria-labelledby="most-read">
          {mostRead.map((post) => (
            <li key={post.id} className="py-4 first:pt-0">
              <article className="group relative flex gap-3">
                <div className="relative aspect-square w-20 shrink-0 overflow-hidden bg-muted">
                  {post.cover_image_url && <Image src={post.cover_image_url} alt="" fill sizes="80px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <h3 className="leading-snug font-semibold">
                    <Link href={href(post)} className="line-clamp-3 after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{post.views.toLocaleString("en-GB")} views</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Full-width row of the newest headlines, text only, with relative times. */
export function JustIn({ posts }: { posts: PostSummary[] }) {
  if (!posts.length) return null
  return (
    <section aria-labelledby="just-in" className="border-y-2 border-foreground py-6">
      <h2 id="just-in" className="mb-4 font-sans text-xs font-bold tracking-[0.18em] uppercase">
        Just In
      </h2>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x">
        {posts.map((post) => (
          <li key={post.id} className="lg:px-6 lg:first:pl-0 lg:last:pr-0">
            <article className="group relative">
              {post.published_at && (
                <time dateTime={post.published_at} className="text-xs font-medium text-muted-foreground">
                  {timeAgo(post.published_at)}
                </time>
              )}
              <h3 className="mt-1 leading-snug font-bold">
                <Link href={href(post)} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
                  {post.title}
                </Link>
              </h3>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** One column per section: photo lead + three headlines + link to the section. */
export function SectionColumns({ sections }: { sections: { slug: string; name: string; posts: PostSummary[] }[] }) {
  if (!sections.length) return null
  return (
    <section aria-label="Sections" className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map(({ slug, name, posts }) => {
        const [main, ...rest] = posts
        if (!main) return null
        return (
          <div key={slug}>
            <h2 className="mb-4 flex items-baseline justify-between border-b-2 border-foreground pb-2">
              <Link href={`/category/${slug}`} className="text-2xl font-bold tracking-tight hover:underline hover:underline-offset-4">
                {name}
              </Link>
              <Link href={`/category/${slug}`} className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-muted-foreground hover:text-foreground">
                More <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </h2>
            <article className="group relative">
              <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                {main.cover_image_url && (
                  <Image src={main.cover_image_url} alt="" fill sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
                )}
              </div>
              <h3 className="mt-3 text-xl leading-snug font-bold">
                <Link href={href(main)} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
                  {main.title}
                </Link>
              </h3>
            </article>
            <ul className="mt-3 flex flex-col divide-y border-t">
              {rest.slice(0, 3).map((post) => (
                <li key={post.id}>
                  <Link href={href(post)} className="block py-2.5 font-sans text-[0.95rem] leading-snug font-medium hover:underline hover:underline-offset-4">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
