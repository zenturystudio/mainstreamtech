"use client"

import { useState } from "react"
import { LeadWithList } from "@/components/home-v2/lead-with-list"
import { cn } from "@/lib/utils"
import type { PostSummary } from "@/types/app"

type Tab = { slug: string; name: string; posts: PostSummary[] }

/** One tab per section; switching is instant because every tab's posts come from the server. */
export function SectionTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(tabs[0]?.slug)
  const current = tabs.find((t) => t.slug === active) ?? tabs[0]
  if (!current) return null

  return (
    <section aria-labelledby="sections-heading">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <h2 id="sections-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
          Latest News
        </h2>
        <div role="tablist" aria-label="Sections" className="-mx-4 flex gap-1 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0">
          {tabs.map((t) => (
            <button
              key={t.slug}
              role="tab"
              id={`tab-${t.slug}`}
              aria-selected={t.slug === current.slug}
              aria-controls={`panel-${t.slug}`}
              onClick={() => setActive(t.slug)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                t.slug === current.slug ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      <div role="tabpanel" id={`panel-${current.slug}`} aria-labelledby={`tab-${current.slug}`}>
        <LeadWithList posts={current.posts} moreHref={`/category/${current.slug}`} moreLabel={`More in ${current.name}`} />
      </div>
    </section>
  )
}
