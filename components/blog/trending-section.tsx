import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Flame } from "lucide-react"
import { formatDate } from "@/lib/utils"
import type { PostSummary } from "@/types/app"
import { postPath } from "@/lib/urls"

/** Homepage strip: the most-read recent stories. */
export function TrendingSection({ posts }: { posts: PostSummary[] }) {
  if (!posts.length) return null

  return (
    <section aria-labelledby="trending-heading" className="mt-16 sm:mt-20">
      <div className="mb-6 flex items-end justify-between gap-4 border-b pb-4">
        <div>
          <p className="inline-flex items-center gap-1.5 font-mono text-xs tracking-widest text-brand uppercase">
            <Flame className="size-3.5" aria-hidden /> Most read right now
          </p>
          <h2 id="trending-heading" className="mt-1 text-3xl font-bold tracking-tight">
            Trending
          </h2>
        </div>
        <Link href="/blog?sort=popular" className="inline-flex items-center gap-1 text-sm font-medium hover:text-brand">
          See all <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>

      <ul className="grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
        {posts.map((post) => (
          <li key={post.id} className="group relative flex">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              {post.cover_image_url && (
                <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-muted">
                  <Image src={post.cover_image_url} alt="" fill sizes="(min-width: 1024px) 240px, (min-width: 640px) 45vw, 80vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                </div>
              )}
              {post.category && <p className="text-xs font-semibold text-brand">{post.category.name}</p>}
              <h3 className="line-clamp-3 leading-snug font-semibold">
                <Link href={postPath(post.slug)} className="after:absolute after:inset-0 group-hover:underline group-hover:decoration-brand/40 group-hover:underline-offset-4">
                  {post.title}
                </Link>
              </h3>
              <p className="text-xs text-muted-foreground">
                {post.published_at && formatDate(post.published_at, "d MMM")} · {post.reading_time} min read
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
