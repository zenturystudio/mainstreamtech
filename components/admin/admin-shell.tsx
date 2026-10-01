"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Bell, ChevronDown, ExternalLink, Globe, LogOut, Menu, Plus, Search, UserCircle } from "lucide-react"
import { adminNav, isNavActive } from "@/components/admin/nav"
import { UserAvatar } from "@/components/admin/user-avatar"
import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { TooltipProvider } from "@/components/ui/tooltip"
import { signOut } from "@/lib/actions/auth"
import type { Notifications } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"

type ShellUser = { name: string; email: string; avatarUrl: string | null; role: "admin" | "author" }

export function AdminShell({
  user,
  siteHref,
  notifications,
  children,
}: {
  user: ShellUser
  siteHref: string
  notifications: Notifications
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    // TooltipProvider: required by tooltips inside admin pages (e.g. the editor toolbar).
    // admin-ui: CMS headings use the sans font (see globals.css).
    <TooltipProvider delayDuration={200}>
      <div className="admin-ui flex min-h-svh bg-muted/50 dark:bg-background">
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r bg-background lg:flex">
          <div className="flex h-16 items-center px-5">
            <Logo className="[&_img]:h-5" />
          </div>
          <div className="px-4 pt-2 pb-4">
            <CreateButton />
          </div>
          <SidebarNav role={user.role} />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-md sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 gap-0 overflow-y-auto p-0">
                <SheetHeader className="border-b">
                  <SheetTitle>
                    <Logo className="[&_img]:h-5" />
                  </SheetTitle>
                </SheetHeader>
                <div className="px-4 pt-4 pb-4">
                  <CreateButton onNavigate={() => setMobileOpen(false)} />
                </div>
                <SidebarNav role={user.role} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <form action="/admin/posts" role="search" className="relative hidden w-full max-w-sm sm:block">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                name="q"
                placeholder="Search anything…"
                aria-label="Search posts"
                className="h-10 w-full rounded-xl border-0 bg-muted/70 pr-4 pl-9 text-sm outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-ring/40"
              />
            </form>

            <div className="ml-auto flex items-center gap-1.5">
              <Button asChild variant="outline" className="hidden h-9 rounded-xl sm:inline-flex">
                <a href={siteHref} target="_blank" rel="noopener noreferrer">
                  <Globe /> Visit Site
                </a>
              </Button>
              <ThemeToggle />
              <NotificationsBell notifications={notifications} />
              <DropdownMenu>
                <DropdownMenuTrigger className="ml-1 flex items-center gap-2.5 rounded-full py-1 pr-2 pl-1 outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50">
                  <UserAvatar name={user.name} src={user.avatarUrl} size={34} />
                  <span className="hidden text-sm font-semibold sm:block">{user.name}</span>
                  <ChevronDown className="hidden size-4 text-muted-foreground sm:block" aria-hidden />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    <p className="mt-1.5 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold capitalize">{user.role}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile">
                      <UserCircle /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <a href={siteHref} target="_blank" rel="noopener noreferrer">
                      <ExternalLink /> View site
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <form action={signOut}>
                    <DropdownMenuItem asChild variant="destructive">
                      <button type="submit" className="w-full">
                        <LogOut /> Sign out
                      </button>
                    </DropdownMenuItem>
                  </form>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  )
}

function CreateButton({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Button asChild variant="outline" className="h-11 w-full rounded-xl border-foreground/80 font-semibold">
      <Link href="/admin/posts/new" onClick={onNavigate}>
        <Plus className="size-4" /> Create Article
      </Link>
    </Button>
  )
}

function NotificationsBell({ notifications }: { notifications: Notifications }) {
  const { scheduled, drafts, newSubscribers } = notifications
  const count = scheduled.length + (drafts > 0 ? 1 : 0) + (newSubscribers > 0 ? 1 : 0)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={count ? `Notifications (${count})` : "Notifications"}>
          <Bell className="size-[18px]" />
          {count > 0 && <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-foreground ring-2 ring-background" aria-hidden />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <p className="border-b px-4 py-3 text-sm font-semibold">Notifications</p>
        {count === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          <ul className="divide-y text-sm">
            {scheduled.map((p) => (
              <li key={p.id}>
                <Link href={`/admin/posts/${p.id}/edit`} className="block px-4 py-3 hover:bg-muted/60">
                  <p className="text-xs text-muted-foreground">
                    Goes live{" "}
                    {p.published_at && new Date(p.published_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="mt-0.5 line-clamp-2 font-medium">{p.title}</p>
                </Link>
              </li>
            ))}
            {drafts > 0 && (
              <li>
                <Link href="/admin/posts?status=draft" className="block px-4 py-3 hover:bg-muted/60">
                  <p className="font-medium">
                    {drafts} {drafts === 1 ? "draft" : "drafts"} waiting
                  </p>
                  <p className="text-xs text-muted-foreground">Finish and publish them from Posts.</p>
                </Link>
              </li>
            )}
            {newSubscribers > 0 && (
              <li>
                <Link href="/admin/subscribers" className="block px-4 py-3 hover:bg-muted/60">
                  <p className="font-medium">
                    {newSubscribers} new {newSubscribers === 1 ? "subscriber" : "subscribers"}
                  </p>
                  <p className="text-xs text-muted-foreground">In the last 7 days.</p>
                </Link>
              </li>
            )}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}

function SidebarNav({ role, onNavigate }: { role: ShellUser["role"]; onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto px-4">
      {adminNav.map((group, i) => {
        const items = group.items.filter((item) => !item.adminOnly || role === "admin")
        if (!items.length) return null
        return (
          <div key={i} className={cn(i > 0 && "mt-5")}>
            {group.title && <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">{group.title}</p>}
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active = isNavActive(pathname, item)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-10 items-center gap-3 rounded-xl text-sm font-medium transition-colors",
                        item.sub ? "ml-5 border-l pl-4 text-[13px]" : "px-3",
                        active ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-[18px] shrink-0" aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
