import Link from "next/link"
import { BarChart3, Eye, FilePen, FileText, Mail, Plus, Send, Timer, TriangleAlert } from "lucide-react"
import { AdminEmpty, PageHeading, Panel } from "@/components/admin/page-heading"
import { StatusBadge } from "@/components/admin/status-badge"
import { ViewsChart } from "@/components/admin/views-chart"
import { Button } from "@/components/ui/button"
import { requireUser } from "@/lib/auth"
import { getDashboardData } from "@/lib/queries/admin"
import type { PostStatus } from "@/lib/posts"
import { timeAgo } from "@/lib/utils"

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const [session, { denied }] = await Promise.all([requireUser(), searchParams])
  const { stats, recent, top } = await getDashboardData(session)
  const firstName = (session.profile.full_name || session.profile.username || "there").split(" ")[0]

  const cards = [
    { label: "Total posts", value: stats.total, icon: FileText },
    { label: "Published", value: stats.published, icon: Send },
    { label: "Drafts", value: stats.drafts, icon: FilePen },
    { label: "Scheduled", value: stats.scheduled, icon: Timer },
    { label: session.isAdmin ? "Total views" : "Views on my posts", value: stats.views, icon: Eye },
    ...(stats.subscribers !== null ? [{ label: "Subscribers", value: stats.subscribers, icon: Mail }] : []),
  ]

  return (
    <div className="mx-auto max-w-7xl">
      {denied && (
        <p role="alert" className="mb-6 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <TriangleAlert className="size-4 shrink-0" aria-hidden /> That page is only available to admins.
        </p>
      )}

      <PageHeading
        title={`Welcome back, ${firstName}`}
        description={session.isAdmin ? "Here's what's happening across Mainstream Tech." : "Here's how your stories are doing."}
        actions={
          <Button asChild className="h-9">
            <Link href="/admin/posts/new">
              <Plus /> New post
            </Link>
          </Button>
        }
      />

      <dl className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border bg-background p-5">
            <dt className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
              {label}
              <Icon className="size-4" aria-hidden />
            </dt>
            <dd className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{value.toLocaleString("en-GB")}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Panel title="Most viewed" className="xl:col-span-3">
          {top.length ? (
            <div className="p-5">
              <ViewsChart data={top.map((p) => ({ id: p.id, title: p.title, views: p.views }))} />
            </div>
          ) : (
            <AdminEmpty icon={BarChart3} title="No views yet" description="Views appear here once posts are published and read." />
          )}
        </Panel>

        <Panel
          title="Recently updated"
          className="xl:col-span-2"
          action={
            <Link href="/admin/posts" className="text-sm font-medium text-brand hover:underline">
              View all
            </Link>
          }
        >
          {recent.length ? (
            <ul className="divide-y">
              {recent.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/posts/${p.id}/edit`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {p.author?.full_name ?? "Unknown"} · updated {timeAgo(p.updated_at)}
                      </p>
                    </div>
                    <StatusBadge status={p.status as PostStatus} publishedAt={p.published_at} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <AdminEmpty
              icon={FileText}
              title="No posts yet"
              description="Write your first story to get started."
              action={
                <Button asChild size="sm">
                  <Link href="/admin/posts/new">
                    <Plus /> New post
                  </Link>
                </Button>
              }
            />
          )}
        </Panel>
      </div>
    </div>
  )
}
