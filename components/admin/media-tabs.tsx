import Link from "next/link"
import { cn } from "@/lib/utils"

/** Switches between the "All media" and "Blog media" views. */
export function MediaTabs({ current }: { current: "all" | "blog" }) {
  const tabs = [
    { key: "all", label: "All media", href: "/admin/media" },
    { key: "blog", label: "Blog media", href: "/admin/media/blog" },
  ] as const

  return (
    <nav aria-label="Media views" className="mb-6 inline-flex rounded-full border bg-background p-1">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          aria-current={current === t.key ? "page" : undefined}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            current === t.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  )
}
