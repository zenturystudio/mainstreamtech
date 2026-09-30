import { Suspense } from "react"
import { TriangleAlert } from "lucide-react"
import { Card, CardLink, ChangePill, NextScheduled, RecentlyUpdated, StatBlock, TopArticles } from "@/components/admin/dashboard/cards"
import { DashboardHeader } from "@/components/admin/dashboard/dashboard-header"
import { ViewsChart } from "@/components/admin/dashboard/views-chart"
import { requireUser } from "@/lib/auth"
import { getDashboard, type DashboardRange } from "@/lib/queries/admin"

const RANGE_LABEL: Record<DashboardRange, string> = { week: "last 7 days", month: "last 30 days", year: "last 12 months" }
const nf = new Intl.NumberFormat("en-GB")

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ denied?: string; range?: string }> }) {
  const [session, params] = await Promise.all([requireUser(), searchParams])
  const range: DashboardRange = params.range === "week" || params.range === "year" ? params.range : "month"
  const data = await getDashboard(session, range)
  const firstName = (session.profile.full_name || session.profile.username || "there").split(" ")[0]

  return (
    <div className="mx-auto max-w-7xl">
      {params.denied && (
        <p role="alert" className="mb-6 flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          <TriangleAlert className="size-4 shrink-0" aria-hidden /> That page is only available to admins.
        </p>
      )}

      <Suspense>
        <DashboardHeader firstName={firstName} range={range} />
      </Suspense>

      <div className="grid gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-semibold">Views</p>
              <div className="mt-2 flex flex-wrap items-center gap-2.5">
                <p className="text-4xl font-bold tracking-tight tabular-nums">{nf.format(data.views.total)}</p>
                <ChangePill change={data.views.change} />
              </div>
            </div>
            <p className="rounded-lg bg-muted px-3 py-1.5 text-sm font-medium">{RANGE_LABEL[range]}</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Views on stories published in the {RANGE_LABEL[range]}, by publish date · {nf.format(data.views.allTime)} views all time
          </p>
          <div className="mt-4">
            <ViewsChart data={data.series} />
          </div>
        </Card>

        <Card className="flex flex-col justify-between gap-6">
          {data.subscribers ? (
            <StatBlock
              label="Subscribers"
              value={data.subscribers.total}
              change={data.subscribers.change}
              previous={`From ${nf.format(data.subscribers.previous)} at the start of the period`}
              href="/admin/subscribers"
              linkLabel="View detail"
            />
          ) : (
            <StatBlock label="Drafts" value={data.drafts} change={null} previous="Stories you haven't published yet" href="/admin/posts?status=draft" linkLabel="View drafts" />
          )}
          <div className="h-px bg-border" />
          <StatBlock
            label="Published"
            value={data.published.total}
            change={data.published.change}
            previous={`From ${nf.format(data.published.previous)} in the period before`}
            href="/admin/posts?status=published"
            linkLabel="View detail"
          />
        </Card>

        <Card title="Next Article Schedule" action={<CardLink href="/admin/posts?status=scheduled">View all</CardLink>}>
          <NextScheduled post={data.nextScheduled} />
        </Card>

        <Card title="Your Top Articles" action={<CardLink href="/admin/posts?sort=views">View all</CardLink>}>
          <TopArticles posts={data.top} />
        </Card>

        <Card title="Recently Updated" action={<CardLink href="/admin/posts">View all</CardLink>}>
          <RecentlyUpdated posts={data.recent} />
        </Card>
      </div>
    </div>
  )
}
