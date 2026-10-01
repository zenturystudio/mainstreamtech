import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  page: number
  totalPages: number
  basePath: string
  /** Extra query params to keep on every page link (e.g. sort, q). */
  params?: Record<string, string | undefined>
}

function pageNumbers(page: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = new Set([1, total, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (["…", p] as const) : [p]))
}

export function Pagination({ page, totalPages, basePath, params = {} }: Props) {
  if (totalPages <= 1) return null

  const href = (p: number) => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => v && search.set(k, v))
    if (p > 1) search.set("page", String(p))
    const qs = search.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const item = "grid h-9 min-w-9 place-items-center rounded-full px-3 text-sm font-medium transition-colors"

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(item, "gap-1 hover:bg-muted")} rel="prev" aria-label="Previous page">
          <span className="flex items-center gap-1">
            <ChevronLeft className="size-4" aria-hidden /> <span className="hidden sm:inline">Previous</span>
          </span>
        </Link>
      ) : (
        <span className={cn(item, "pointer-events-none text-muted-foreground/50")} aria-hidden>
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pageNumbers(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className={cn(item, "text-muted-foreground")}>
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={`Page ${p}`}
            className={cn(item, p === page ? "bg-foreground text-background" : "hover:bg-muted")}
          >
            {p}
          </Link>
        )
      )}

      {page < totalPages ? (
        <Link href={href(page + 1)} className={cn(item, "hover:bg-muted")} rel="next" aria-label="Next page">
          <span className="flex items-center gap-1">
            <span className="hidden sm:inline">Next</span> <ChevronRight className="size-4" aria-hidden />
          </span>
        </Link>
      ) : (
        <span className={cn(item, "pointer-events-none text-muted-foreground/50")} aria-hidden>
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  )
}
