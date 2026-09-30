"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useId, useState } from "react"
import { ChevronDown } from "lucide-react"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"
import type { Category } from "@/types/app"

/**
 * Path-based active state. Links with a query string (Trending) are never
 * marked active: reading search params here would force the nav to render
 * client-side only and drop it from the server HTML.
 */
export function useIsActive() {
  const pathname = usePathname()
  return (href: string) => {
    if (href.includes("?")) return false
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(`${href}/`)
  }
}

const linkClass = (active: boolean) =>
  cn(
    "inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-sm font-medium transition-colors",
    active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
  )

export function NavLinks({ categories }: { categories: Category[] }) {
  const isActive = useIsActive()
  const pathname = usePathname()
  // Home · Latest · Trending · Categories (dropdown) · About · Contact
  const [home, latest, trending, ...pages] = siteConfig.nav

  const renderLink = (item: (typeof siteConfig.nav)[number]) => (
    <Link key={item.href} href={item.href} className={linkClass(isActive(item.href))} aria-current={isActive(item.href) ? "page" : undefined}>
      {item.label}
    </Link>
  )

  return (
    <nav aria-label="Main" className="flex items-center gap-0.5">
      {renderLink(home)}
      {renderLink(latest)}
      {renderLink(trending)}
      <HoverMenu
        label="Categories"
        active={pathname.startsWith("/category")}
        items={categories.map((c) => ({ label: c.name, href: `/category/${c.slug}`, description: c.description }))}
      />
      {pages.map(renderLink)}
    </nav>
  )
}

type MenuItem = { label: string; href: string; description?: string | null }

/** Opens on hover (desktop) and on click/Enter (touch, keyboard); Escape closes. */
function HoverMenu({ label, active, items, width = "w-80" }: { label: string; active: boolean; items: readonly MenuItem[]; width?: string }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const menuId = useId()

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          setOpen(false)
          ;(e.currentTarget.querySelector("button") as HTMLButtonElement | null)?.focus()
        }
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        className={cn(linkClass(active || open), "outline-none focus-visible:ring-3 focus-visible:ring-ring/50")}
      >
        {label} <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </button>

      {/* pt-2 bridges the gap so the pointer can travel into the panel. */}
      <div
        id={menuId}
        className={cn(
          "absolute top-full left-0 z-50 pt-2 transition duration-150 ease-out",
          open ? "visible translate-y-0 opacity-100" : "pointer-events-none invisible -translate-y-1 opacity-0"
        )}
      >
        <ul className={cn("rounded-2xl border bg-popover p-2 text-popover-foreground shadow-xl shadow-black/5", width)}>
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                aria-current={pathname === item.href ? "page" : undefined}
                className="group/item block rounded-xl px-3 py-2.5 transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none aria-[current=page]:bg-muted"
              >
                <span className="block text-sm font-semibold group-hover/item:text-brand">{item.label}</span>
                {item.description && <span className="mt-0.5 line-clamp-1 block text-xs text-muted-foreground">{item.description}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
