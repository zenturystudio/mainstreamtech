"use client"

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Row = { id: string; title: string; views: number }

const truncate = (s: string, n = 26) => (s.length > n ? `${s.slice(0, n - 1)}…` : s)
const compact = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 })

/** Top posts by views: a single-series ranked bar chart in the brand colour. */
export function ViewsChart({ data }: { data: Row[] }) {
  return (
    <figure>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 0 }} barCategoryGap={10}>
            <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="0" />
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="title"
              width={190}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(t: string) => truncate(t)}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", opacity: 0.6 }}
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as Row | undefined
                if (!active || !row) return null
                return (
                  <div className="max-w-64 rounded-lg border bg-popover px-3 py-2 text-sm shadow-md">
                    <p className="font-medium text-popover-foreground">{row.title}</p>
                    <p className="mt-0.5 text-muted-foreground tabular-nums">{row.views.toLocaleString("en-GB")} views</p>
                  </div>
                )
              }}
            />
            <Bar dataKey="views" fill="var(--brand)" radius={[0, 4, 4, 0]} maxBarSize={18}>
              <LabelList dataKey="views" position="right" formatter={(v) => compact.format(Number(v))} style={{ fill: "var(--foreground)", fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Screen-reader / table view of the same data. */}
      <figcaption className="sr-only">
        <table>
          <caption>Most viewed posts</caption>
          <thead>
            <tr>
              <th>Post</th>
              <th>Views</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.views}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  )
}
