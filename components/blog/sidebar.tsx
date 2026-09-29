import Link from "next/link"
import { Mail } from "lucide-react"
import { NewsletterForm } from "@/components/shared/newsletter-form"
import { cn, formatDate } from "@/lib/utils"
import type { Category, PostSummary, Tag, WithCount } from "@/types/app"

export function SidebarSection({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border p-6", className)}>
      <h2 className="mb-4 font-mono text-xs tracking-widest text-muted-foreground uppercase">{title}</h2>
      {children}
    </section>
  )
}

export function CategoryList({ categories }: { categories: WithCount<Category>[] }) {
  return (
    <ul className="-mx-2 flex flex-col">
      {categories.map((c) => (
        <li key={c.id}>
          <Link
            href={`/category/${c.slug}`}
            className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            {c.name}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums">{c.postCount}</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function PopularPosts({ posts }: { posts: PostSummary[] }) {
  return (
    <ol className="flex flex-col gap-4">
      {posts.map((post) => (
        <li key={post.id} className="group relative">
          <h3 className="text-sm leading-snug font-semibold">
            <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0 group-hover:text-brand">
              {post.title}
            </Link>
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {post.views.toLocaleString("en-US")} views
            {post.published_at && <> · {formatDate(post.published_at, "MMM d")}</>}
          </p>
        </li>
      ))}
    </ol>
  )
}

export function TagCloud({ tags, activeSlug }: { tags: WithCount<Tag>[] | Tag[]; activeSlug?: string }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {tags.map((t) => (
        <li key={t.id}>
          <Link
            href={`/tag/${t.slug}`}
            aria-current={t.slug === activeSlug ? "page" : undefined}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              t.slug === activeSlug ? "border-foreground bg-foreground text-background" : "hover:border-foreground/30 hover:bg-muted"
            )}
          >
            #{t.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function NewsletterCard() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-foreground p-6 text-background">
      <div aria-hidden className="absolute -top-16 -right-16 size-44 rounded-full bg-brand/40 blur-3xl" />
      <div className="relative">
        <span className="grid size-10 place-items-center rounded-xl bg-background/10">
          <Mail className="size-5" aria-hidden />
        </span>
        <h2 className="mt-4 text-lg font-semibold">The weekly briefing</h2>
        <p className="mt-1.5 text-sm text-background/70">The week&apos;s most important stories, every Friday.</p>
        <NewsletterForm id="sidebar-newsletter" className="mt-5 [&_input]:border-background/20 [&_input]:bg-background/10 [&_input]:text-background [&_input]:placeholder:text-background/50 [&_button]:bg-background [&_button]:text-foreground [&_button:hover]:bg-background/90" />
      </div>
    </section>
  )
}
