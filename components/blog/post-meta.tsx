import Image from "next/image"
import Link from "next/link"
import { Clock } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"
import type { Author, Category } from "@/types/app"

export function AuthorAvatar({ author, size = 28, className }: { author: Author; size?: number; className?: string }) {
  const initials = (author.full_name ?? author.username ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-muted text-xs font-medium", className)}
      style={{ width: size, height: size }}
    >
      {author.avatar_url ? (
        <Image src={author.avatar_url} alt="" fill sizes={`${size * 2}px`} className="object-cover" />
      ) : (
        initials
      )}
    </span>
  )
}

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className={cn(
        "relative z-10 inline-flex w-fit items-center rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-brand-foreground",
        className
      )}
    >
      {category.name}
    </Link>
  )
}

type PostMetaProps = {
  author: Author
  publishedAt: string | null
  readingTime: number
  avatarSize?: number
  className?: string
}

export function PostMeta({ author, publishedAt, readingTime, avatarSize = 28, className }: PostMetaProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 text-sm text-muted-foreground", className)}>
      {author.username ? (
        <Link href={`/author/${author.username}`} className="relative z-10 flex min-w-0 items-center gap-2 font-medium text-foreground hover:text-brand">
          <AuthorAvatar author={author} size={avatarSize} />
          <span className="truncate">{author.full_name}</span>
        </Link>
      ) : (
        <span className="flex min-w-0 items-center gap-2 font-medium text-foreground">
          <AuthorAvatar author={author} size={avatarSize} />
          <span className="truncate">{author.full_name}</span>
        </span>
      )}
      <span aria-hidden>·</span>
      {publishedAt && (
        <time dateTime={publishedAt} className="shrink-0">
          {formatDate(publishedAt)}
        </time>
      )}
      <span aria-hidden className="hidden sm:inline">·</span>
      <span className="hidden shrink-0 items-center gap-1 sm:inline-flex">
        <Clock className="size-3.5" aria-hidden />
        {readingTime} min read
      </span>
    </div>
  )
}
