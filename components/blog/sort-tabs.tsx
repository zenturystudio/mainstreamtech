import Link from "next/link"
import { cn } from "@/lib/utils"
import type { SortOrder } from "@/lib/queries/public"

const options: { value: SortOrder; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Most popular" },
]

export function SortTabs({ basePath, current }: { basePath: string; current: SortOrder }) {
  return (
    <nav aria-label="Sort posts" className="inline-flex rounded-full border bg-muted/40 p-1">
      {options.map((o) => (
        <Link
          key={o.value}
          href={o.value === "latest" ? basePath : `${basePath}?sort=${o.value}`}
          aria-current={current === o.value ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            current === o.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </Link>
      ))}
    </nav>
  )
}
