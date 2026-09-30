import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { PostSummary } from "@/types/app"

/**
 * Large lead story on the left, smaller thumbnail stories on the right, and a
 * "More in …" link. Shared by the Latest News tabs and the section blocks.
 */
export function LeadWithList({ posts, moreHref, moreLabel }: { posts: PostSummary[]; moreHref: string; moreLabel: string }) {
  const [main, ...rest] = posts
  if (!main) return null

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <article className="group relative">
        <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
          {main.cover_image_url && (
            <Image src={main.cover_image_url} alt="" fill sizes="(min-width: 1024px) 700px, 100vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          )}
        </div>
        <h3 className="mt-4 text-2xl leading-tight font-bold tracking-tight sm:text-3xl">
          <Link href={`/blog/${main.slug}`} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
            {main.title}
          </Link>
        </h3>
        {main.excerpt && <p className="mt-2 line-clamp-2 text-muted-foreground">{main.excerpt}</p>}
      </article>

      <div className="flex flex-col">
        <ul className="flex flex-col divide-y">
          {rest.map((post) => (
            <li key={post.id} className="py-4 first:pt-0">
              <article className="group relative flex gap-4">
                <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {post.cover_image_url && <Image src={post.cover_image_url} alt="" fill sizes="96px" className="object-cover" />}
                </div>
                <div className="min-w-0">
                  <h3 className="line-clamp-3 leading-snug font-semibold">
                    <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:underline group-hover:underline-offset-4">
                      {post.title}
                    </Link>
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{post.reading_time} min read</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
        <Link href={moreHref} className="mt-4 inline-flex items-center gap-1.5 self-start border-b border-foreground/30 pb-0.5 text-sm font-semibold hover:border-foreground">
          {moreLabel} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  )
}
