import Image from "next/image"
import Link from "next/link"
import { ArrowDown, ArrowUp, CalendarClock, Clock, FilePlus2 } from "lucide-react"
import { StatusBadge } from "@/components/admin/status-badge"
import type { DashboardData } from "@/lib/queries/admin"
import type { PostStatus } from "@/lib/posts"
import { cn, formatDate, timeAgo } from "@/lib/utils"

const nf = new Intl.NumberFormat("en-GB")

export function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border bg-background p-5 sm:p-6", className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function CardLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-semibold underline-offset-4 hover:underline">
      {children}
    </Link>
  )
}

/** "▲ 3.5%" pill. null = no previous data to compare against. */
export function ChangePill({ change }: { change: number | null }) {
  if (change === null) return <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">New</span>
  const up = change >= 0
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        up ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-red-500/10 text-red-700 dark:text-red-400"
      )}
    >
      {up ? <ArrowUp className="size-3" aria-label="Up" /> : <ArrowDown className="size-3" aria-label="Down" />}
      {Math.abs(change).toFixed(1)}%
    </span>
  )
}

/** Big number with change pill and a "From …" line, like Follower/Earnings in the design. */
export function StatBlock({ label, value, change, previous, href, linkLabel }: { label: string; value: number; change: number | null; previous: string; href: string; linkLabel: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold">{label}</p>
        <CardLink href={href}>{linkLabel}</CardLink>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <p className="text-4xl font-bold tracking-tight tabular-nums">{nf.format(value)}</p>
        <ChangePill change={change} />
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{previous}</p>
    </div>
  )
}

export function NextScheduled({ post }: { post: DashboardData["nextScheduled"] }) {
  if (!post) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed px-4 py-8 text-center">
        <CalendarClock className="size-8 text-muted-foreground" aria-hidden />
        <p className="mt-3 font-medium">Nothing scheduled</p>
        <p className="mt-1 text-sm text-muted-foreground">Set a story to “Scheduled” to publish it later.</p>
        <Link href="/admin/posts/new" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline hover:underline-offset-4">
          <FilePlus2 className="size-4" aria-hidden /> Create article
        </Link>
      </div>
    )
  }
  return (
    <Link href={`/admin/posts/${post.id}/edit`} className="group block overflow-hidden rounded-xl border">
      <div className="relative aspect-[16/9] bg-muted">
        {post.cover_image_url && <Image src={post.cover_image_url} alt="" fill sizes="360px" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" />}
      </div>
      <div className="p-4">
        <p className="line-clamp-2 font-semibold group-hover:underline group-hover:underline-offset-4">{post.title}</p>
        {post.published_at && (
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formatDate(post.published_at, "MMM d, yyyy")}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" aria-hidden /> {new Date(post.published_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </p>
        )}
      </div>
    </Link>
  )
}

export function TopArticles({ posts }: { posts: DashboardData["top"] }) {
  if (!posts.length) return <p className="py-8 text-center text-sm text-muted-foreground">No published stories yet.</p>
  return (
    <ul className="flex flex-col gap-4">
      {posts.map((p) => (
        <li key={p.id}>
          <Link href={`/admin/posts/${p.id}/edit`} className="group flex items-center gap-4">
            <div className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
              {p.cover_image_url && <Image src={p.cover_image_url} alt="" fill sizes="96px" className="object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 font-semibold group-hover:underline group-hover:underline-offset-4">{p.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.published_at && formatDate(p.published_at, "MMM d, yyyy")} · {p.reading_time} min read · {nf.format(p.views)} views
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function RecentlyUpdated({ posts }: { posts: DashboardData["recent"] }) {
  if (!posts.length) return <p className="py-8 text-center text-sm text-muted-foreground">No stories yet.</p>
  return (
    <ul className="flex flex-col divide-y">
      {posts.map((p) => (
        <li key={p.id} className="py-3 first:pt-0 last:pb-0">
          <Link href={`/admin/posts/${p.id}/edit`} className="group block">
            <p className="line-clamp-1 font-semibold group-hover:underline group-hover:underline-offset-4">{p.title}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <StatusBadge status={p.status as PostStatus} publishedAt={p.published_at} />
              <span>{p.author?.full_name ?? "Mainstream Tech"}</span>
              <span aria-hidden>·</span>
              <span>edited {timeAgo(p.updated_at)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
