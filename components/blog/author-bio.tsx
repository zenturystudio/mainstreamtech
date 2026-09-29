import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AuthorAvatar } from "@/components/blog/post-meta"
import type { Author } from "@/types/app"

export function AuthorBio({ author }: { author: Author }) {
  return (
    <section aria-label="About the author" className="flex flex-col gap-5 rounded-2xl border bg-muted/30 p-6 sm:flex-row sm:p-8">
      <AuthorAvatar author={author} size={72} />
      <div className="min-w-0">
        <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Written by</p>
        <h2 className="mt-1 text-xl font-semibold">{author.full_name}</h2>
        {author.title && <p className="text-sm text-muted-foreground">{author.title}</p>}
        {author.bio && <p className="mt-3 leading-relaxed text-foreground/85">{author.bio}</p>}
        <Link
          href={`/author/${author.username}`}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline hover:underline-offset-4"
        >
          More from {author.full_name?.split(" ")[0]} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}
