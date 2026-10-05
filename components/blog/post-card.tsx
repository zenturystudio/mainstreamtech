import Image from "next/image"
import Link from "next/link"
import { CategoryBadge, PostMeta } from "@/components/blog/post-meta"
import { cn, formatDate } from "@/lib/utils"
import type { PostSummary } from "@/types/app"
import { postPath } from "@/lib/urls"

type Variant = "default" | "horizontal" | "compact"

/**
 * The title link stretches over the whole card (after:inset-0) so the card is
 * one click target, while category and author links sit above it with z-10.
 */
export function PostCard({
  post,
  variant = "default",
  priority,
  className,
  headingAs: Heading = "h3",
}: {
  post: PostSummary
  variant?: Variant
  priority?: boolean
  className?: string
  /** Use "h2" when the card sits directly under the page's h1 (keeps heading order valid). */
  headingAs?: "h2" | "h3"
}) {
  const href = postPath(post.slug)

  if (variant === "compact") {
    return (
      <article className={cn("group relative flex gap-4", className)}>
        {post.cover_image_url && (
          <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={post.cover_image_url} alt="" fill sizes="80px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
          </div>
        )}
        <div className="flex min-w-0 flex-col justify-center gap-1.5">
          <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
            <Link href={href} className="after:absolute after:inset-0 group-hover:text-brand">
              {post.title}
            </Link>
          </h3>
          {post.published_at && (
            <p className="text-xs text-muted-foreground">
              <time dateTime={post.published_at}>{formatDate(post.published_at)}</time> · {post.reading_time} min read
            </p>
          )}
        </div>
      </article>
    )
  }

  const horizontal = variant === "horizontal"

  return (
    <article className={cn("group relative flex flex-col gap-5", horizontal && "sm:grid sm:grid-cols-2 sm:items-center sm:gap-8", className)}>
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        {post.cover_image_url && (
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            priority={priority}
            fetchPriority={priority ? "high" : undefined}
            sizes={horizontal ? "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"}
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="flex flex-col gap-3">
        {post.category && <CategoryBadge category={post.category} />}
        <Heading className={cn("leading-tight font-semibold tracking-tight", horizontal ? "text-2xl" : "text-xl")}>
          <Link href={href} className="decoration-brand/40 decoration-2 underline-offset-4 after:absolute after:inset-0 group-hover:underline">
            {post.title}
          </Link>
        </Heading>
        {post.excerpt && <p className={cn("text-muted-foreground", horizontal ? "line-clamp-3" : "line-clamp-2")}>{post.excerpt}</p>}
        <PostMeta author={post.author} publishedAt={post.published_at} readingTime={post.reading_time} className="mt-1" />
      </div>
    </article>
  )
}

export function PostGrid({ posts, className, headingAs }: { posts: PostSummary[]; className?: string; headingAs?: "h2" | "h3" }) {
  return (
    <div className={cn("grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {posts.map((post, i) => (
        // Grids sit near the top of their pages: the first image is the likely LCP.
        <PostCard key={post.id} post={post} headingAs={headingAs} priority={i === 0} />
      ))}
    </div>
  )
}
