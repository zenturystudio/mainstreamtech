"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense, useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { HeaderSearch } from "@/components/shared/header-search"
import { useIsActive } from "@/components/shared/nav-links"
import { siteConfig } from "@/lib/site"
import { cn } from "@/lib/utils"
import type { Category } from "@/types/app"

export function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const isActive = useIsActive()
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 max-w-[85vw] gap-0 overflow-y-auto">
        <SheetHeader className="border-b">
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col gap-6 p-4">
          <Suspense>
            <HeaderSearch onNavigate={close} />
          </Suspense>
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {[...siteConfig.homeVersions, ...siteConfig.nav.slice(1)].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-base font-medium",
                  isActive(item.href) ? "bg-muted" : "hover:bg-muted/60"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div>
            <p className="px-3 pb-2 font-mono text-xs tracking-widest text-muted-foreground uppercase">Categories</p>
            <div className="flex flex-col gap-1">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  onClick={close}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    pathname === `/category/${c.slug}` ? "bg-muted font-medium" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  )}
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
