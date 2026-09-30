import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Clock } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { PostSummary } from "@/types/app"

// Homepage version 2: magazine layout in black & grey.

const href = (post: PostSummary) => `/blog/${post.slug}`

/** Full-width black band with the lead story. */
export function HeroBand({ lead }: { lead: PostSummary }) {
  return (
    <section aria-label="Lead story" className="bg-foreground text-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <article className="group relative grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="order-2">
            {lead.category && <p className="font-mono text-xs tracking-widest text-background/60 uppercase">{lead.category.name}</p>}
            <h1 className="mt-4 text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl xl:text-6xl">
              <Link href={href(lead)} className="after:absolute after:inset-0">
                {lead.title}
              </Link>
            </h1>
            {lead.excerpt && <p className="mt-5 max-w-xl text-lg leading-relaxed text-background/70">{lead.excerpt}</p>}
            <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-background/60">
              <span className="font-medium text-background">{lead.author.full_name}</span>
              {lead.published_at && <time dateTime={lead.published_at}>{formatDate(lead.published_at, "d MMMM yyyy")}</time>}
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3.5" aria-hidden /> {lead.reading_time} min read
              </span>
            </p>
            <span className="mt-7 inline-flex items-center gap-2 border-b border-background/40 pb-1 text-sm font-semibold transition-colors group-hover:border-background">
              Read the story <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
          <div className="relative order-1 aspect-[4/3] overflow-hidden rounded-2xl bg-background/10">
            {lead.cover_image_url && (
              <Image
                src={lead.cover_image_url}
                alt=""
                fill
                priority
                sizes="(min-width: 1280px) 600px, (min-width: 1024px) 50vw, 100vw"
                className="object-cover grayscale-[15%] transition-transform duration-700 group-hover:scale-[1.03]"
              />
            )}
          </div>
        </article>

      </div>
    </section>
  )
}

function OverlayCard({ post, tall, priority }: { post: PostSummary; tall?: boolean; priority?: boolean }) {
  return (
    <article className="group relative h-full min-h-56 overflow-hidden rounded-2xl bg-muted">
      {post.cover_image_url && (
        <Image
          src={post.cover_image_url}
          alt=""
          fill
          priority={priority}
          sizes={tall ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
        {post.category && <p className="font-mono text-[11px] tracking-widest text-white/70 uppercase">{post.category.name}</p>}
        <h3 className={tall ? "mt-2 text-2xl leading-tight font-bold sm:text-3xl" : "mt-1.5 text-lg leading-snug font-semibold"}>
          <Link href={href(post)} className="after:absolute after:inset-0">
            {post.title}
          </Link>
        </h3>
        {tall && post.excerpt && <p className="mt-2 line-clamp-2 max-w-lg text-white/75">{post.excerpt}</p>}
      </div>
    </article>
  )
}

/** Mosaic: one tall card on the left, four smaller cards in a 2×2 grid. */
export function PicksMosaic({ posts }: { posts: PostSummary[] }) {
  const [main, ...others] = posts
  if (!main) return null
  return (
    <section aria-labelledby="picks-heading">
      <SectionTitle id="picks-heading" title="Editor's picks" />
      <div className="grid gap-4 lg:grid-cols-2 lg:grid-rows-2">
        <div className="min-h-80 lg:row-span-2 lg:min-h-[560px]">
          <OverlayCard post={main} tall />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:row-span-2 lg:grid-rows-2">
          {others.slice(0, 4).map((post) => (
            <OverlayCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  )
}

/** A grid of photo cards (four across on desktop), used for Trending. */
export function StoryGrid({ id, title, posts, moreHref }: { id: string; title: string; posts: PostSummary[]; moreHref?: string }) {
  if (!posts.length) return null
  return (
    <section aria-labelledby={id}>
      <SectionTitle id={id} title={title} moreHref={moreHref} />
      <ul className="grid gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <li key={post.id}>
            <article className="group relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
                {post.cover_image_url && (
                  <Image src={post.cover_image_url} alt="" fill sizes="(min-width: 1280px) 300px, (min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                )}
              </div>
              {post.category && <p className="mt-3 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">{post.category.name}</p>}
              <h3 className="mt-1 line-clamp-3 leading-snug font-semibold">
                <Link href={href(post)} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
                  {post.title}
                </Link>
              </h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                {post.views.toLocaleString("en-GB")} views · {post.reading_time} min read
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Stories side by side as cards (photo, headline, excerpt), up to three across. */
export function CardRow({ posts }: { posts: PostSummary[] }) {
  return (
    <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.id}>
          <article className="group relative">
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
              {post.cover_image_url && (
                <Image src={post.cover_image_url} alt="" fill sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              )}
            </div>
            <h3 className="mt-4 text-xl leading-snug font-bold tracking-tight">
              <Link href={href(post)} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
                {post.title}
              </Link>
            </h3>
            {post.excerpt && <p className="mt-2 line-clamp-3 text-muted-foreground">{post.excerpt}</p>}
            <p className="mt-3 text-xs text-muted-foreground">
              {post.published_at && formatDate(post.published_at, "d MMMM yyyy")} · {post.reading_time} min read
            </p>
          </article>
        </li>
      ))}
    </ul>
  )
}

export function SectionTitle({ id, title, moreHref }: { id: string; title: string; moreHref?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <h2 id={id} className="text-3xl font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {moreHref && (
        <Link href={moreHref} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
          See all <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </div>
  )
}
