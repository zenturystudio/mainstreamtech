import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { PostCard } from "@/components/blog/post-card"
import { CategoryBadge, PostMeta } from "@/components/blog/post-meta"
import type { PostSummary } from "@/types/app"

export function FeaturedHero({ lead, picks }: { lead: PostSummary; picks: PostSummary[] }) {
  return (
    <section aria-labelledby="featured-heading" className="grid gap-10 lg:grid-cols-12 lg:gap-12">
      <h2 id="featured-heading" className="sr-only">
        Featured stories
      </h2>

      <article className="group relative lg:col-span-8">
        <div className="relative aspect-[16/10] overflow-hidden rounded-3xl bg-muted sm:aspect-[16/9]">
          {lead.cover_image_url && (
            <Image
              src={lead.cover_image_url}
              alt={lead.title}
              fill
              priority
              sizes="(min-width: 1280px) 800px, (min-width: 1024px) 66vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-6 text-white sm:p-10">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-black">Featured</span>
              {lead.category && <CategoryBadge category={lead.category} className="bg-white/15 text-white backdrop-blur hover:bg-white hover:text-black" />}
            </div>
            <h3 className="max-w-3xl text-2xl leading-tight font-bold tracking-tight sm:text-4xl lg:text-[2.75rem]">
              <Link href={`/blog/${lead.slug}`} className="after:absolute after:inset-0">
                {lead.title}
              </Link>
            </h3>
            {lead.excerpt && <p className="line-clamp-2 hidden max-w-2xl text-base text-white/80 sm:block sm:text-lg">{lead.excerpt}</p>}
            <PostMeta
              author={lead.author}
              publishedAt={lead.published_at}
              readingTime={lead.reading_time}
              avatarSize={32}
              // First child is the byline: a link, or plain text for authorless posts.
              className="text-white/75 [&>:first-child]:text-white [&_a:hover]:text-white/80"
            />
          </div>
        </div>
      </article>

      <aside className="flex flex-col lg:col-span-4">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Editor&apos;s picks</h2>
          <Link href="/blog?sort=popular" className="inline-flex items-center gap-1 text-sm font-medium hover:text-brand">
            Most read <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="flex flex-1 flex-col divide-y">
          {picks.map((post) => (
            <PostCard key={post.id} post={post} variant="compact" className="py-4 first:pt-0 last:pb-0" />
          ))}
        </div>
      </aside>
    </section>
  )
}
