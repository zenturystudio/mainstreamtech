import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { PostSummary } from "@/types/app"

export function PostNavigation({ previous, next }: { previous: PostSummary | null; next: PostSummary | null }) {
  if (!previous && !next) return null

  return (
    <nav aria-label="More articles" className="grid gap-4 sm:grid-cols-2">
      {previous ? <NavCard post={previous} direction="previous" /> : <span className="hidden sm:block" />}
      {next && <NavCard post={next} direction="next" />}
    </nav>
  )
}

function NavCard({ post, direction }: { post: PostSummary; direction: "previous" | "next" }) {
  const isNext = direction === "next"
  return (
    <Link
      href={`/blog/${post.slug}`}
      rel={isNext ? "next" : "prev"}
      className={cn("group flex flex-col gap-2 rounded-2xl border p-5 transition-colors hover:border-foreground/20 hover:bg-muted/40", isNext && "sm:items-end sm:text-right")}
    >
      <span className="inline-flex items-center gap-1.5 font-mono text-xs tracking-widest text-muted-foreground uppercase">
        {!isNext && <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" aria-hidden />}
        {isNext ? "Newer article" : "Older article"}
        {isNext && <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />}
      </span>
      <span className="line-clamp-2 font-semibold group-hover:text-brand">{post.title}</span>
    </Link>
  )
}
