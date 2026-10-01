"use client"

import { useId, useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Faq } from "@/types/app"

/**
 * Story FAQ list. Answers are always in the HTML (good for search engines);
 * closed ones collapse to zero height via a grid-rows transition and are
 * made inert so keyboard and screen-reader users skip them.
 */
export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  const [open, setOpen] = useState<number | null>(null)
  const baseId = useId()

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border bg-card">
      {faqs.map((f, i) => {
        const isOpen = open === i
        const buttonId = `${baseId}-q${i}`
        const panelId = `${baseId}-a${i}`
        return (
          <div key={i} className={cn("border-b transition-colors duration-300 last:border-b-0", isOpen && "bg-muted/40")}>
            <h3 className="m-0">
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpen(isOpen ? null : i)}
                className="group flex w-full items-center justify-between gap-6 px-5 py-5 text-left text-base font-semibold leading-snug transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-6 sm:text-lg"
              >
                <span>{f.question}</span>
                <span
                  aria-hidden
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-out",
                    isOpen ? "rotate-45 border-foreground bg-foreground text-background" : "text-muted-foreground group-hover:border-foreground group-hover:text-foreground"
                  )}
                >
                  <Plus className="size-4" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!isOpen}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              )}
            >
              <div className="overflow-hidden">
                <p
                  className={cn(
                    "px-5 pb-6 leading-relaxed whitespace-pre-line text-foreground/80 transition-transform duration-300 ease-out sm:px-6 sm:pr-20",
                    isOpen ? "translate-y-0" : "-translate-y-2"
                  )}
                >
                  {f.answer}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
