"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import type { Heading } from "@/lib/content"

export function TableOfContents({ headings, className }: { headings: Heading[]; className?: string }) {
  const [active, setActive] = useState<string | null>(headings[0]?.id ?? null)

  useEffect(() => {
    const elements = headings.map((h) => document.getElementById(h.id)).filter((el): el is HTMLElement => Boolean(el))
    if (!elements.length) return

    // The active heading is the last one that has scrolled past the top band.
    const observer = new IntersectionObserver(
      () => {
        const passed = elements.filter((el) => el.getBoundingClientRect().top < 140)
        setActive((passed.at(-1) ?? elements[0]).id)
      },
      { rootMargin: "-100px 0px -60% 0px", threshold: [0, 1] }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [headings])

  if (!headings.length) return null

  return (
    <nav aria-label="Table of contents" className={className}>
      <ul className="flex flex-col border-l">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              aria-current={active === h.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l-2 py-1.5 text-sm leading-snug transition-colors",
                h.level === 3 ? "pl-7" : "pl-4",
                active === h.id
                  ? "border-brand font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
