"use client"

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

type Point = { label: string; views: number; stories: number }

const compact = new Intl.NumberFormat("en-GB", { notation: "compact", maximumFractionDigits: 1 })

/** Single-series area chart of views, grouped by publish date. Grey to match the brand. */
export function ViewsChart({ data }: { data: Point[] }) {
  // Show roughly 7 x-axis labels whatever the period.
  const interval = Math.max(0, Math.ceil(data.length / 7) - 1)

  return (
    <figure>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              interval={interval}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              dy={6}
            />
            <YAxis
              width={44}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(v) => compact.format(Number(v))}
            />
            <Tooltip
              cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "4 4" }}
              content={({ active, payload }) => {
                const p = payload?.[0]?.payload as Point | undefined
                if (!active || !p) return null
                return (
                  <div className="rounded-xl border bg-popover px-3 py-2 text-sm shadow-lg">
                    <p className="font-semibold text-popover-foreground tabular-nums">{p.views.toLocaleString("en-GB")} views</p>
                    <p className="text-xs text-muted-foreground">
                      {p.label} · {p.stories} {p.stories === 1 ? "story" : "stories"} published
                    </p>
                  </div>
                )
              }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke="var(--foreground)"
              strokeWidth={2}
              fill="url(#viewsFill)"
              activeDot={{ r: 5, strokeWidth: 2, stroke: "var(--background)", fill: "var(--foreground)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        <table>
          <caption>Views by publish date</caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Views</th>
              <th>Stories</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.label}>
                <td>{d.label}</td>
                <td>{d.views}</td>
                <td>{d.stories}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  )
}
