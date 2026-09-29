"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { ExternalLink, LogOut, Menu, PanelLeftClose, PanelLeftOpen, UserCircle } from "lucide-react"
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { signOut } from "@/lib/actions/auth"
import { cn } from "@/lib/utils"

type ShellUser = { name: string; email: string; avatarUrl: string | null; role: "admin" | "author" }

const STORAGE_KEY = "admin:sidebar-collapsed"

export function AdminShell({ user, siteHref, children }: { user: ShellUser; siteHref: string; children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(STORAGE_KEY) === "1")
    } catch {}
  }, [])

  const toggle = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1")
      } catch {}
      return !c
    })
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex min-h-svh bg-muted/30">
        <aside
          className={cn(
            "sticky top-0 hidden h-svh shrink-0 flex-col border-r bg-background transition-[width] duration-200 lg:flex",
            collapsed ? "w-[68px]" : "w-64"
          )}
        >
          <div className={cn("flex h-16 items-center border-b", collapsed ? "justify-center px-2" : "px-5")}>
            {collapsed ? (
              <Link href="/admin" aria-label="Dashboard" className="grid size-9 place-items-center rounded-lg bg-foreground font-heading text-lg font-bold text-background">
                m
              </Link>
            ) : (
              <Logo className="[&_img]:h-5" />
            )}
          </div>
          <SidebarNav role={user.role} collapsed={collapsed} />
          <div className="border-t p-3">
            <Button variant="ghost" size="sm" onClick={toggle} className={cn("w-full text-muted-foreground", collapsed ? "justify-center" : "justify-start")} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
              {!collapsed && "Collapse"}
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/85 px-4 backdrop-blur-md sm:px-6">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 gap-0 p-0">
                <SheetHeader className="border-b">
                  <SheetTitle>
                    <Logo className="[&_img]:h-5" />
                  </SheetTitle>
                </SheetHeader>
                <SidebarNav role={user.role} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="ml-auto flex items-center gap-1.5">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <a href={siteHref} target="_blank" rel="noopener noreferrer">
                  View site <ExternalLink />
                </a>
              </Button>
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger className="ml-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50" aria-label="Account menu">
                  <UserAvatar name={user.name} src={user.avatarUrl} size={34} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="font-normal">
                    <p className="truncate font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    <p className="mt-1.5 inline-flex rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand capitalize">{user.role}</p>
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

function SidebarNav({ role, collapsed = false, onNavigate }: { role: ShellUser["role"]; collapsed?: boolean; onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <nav aria-label="Admin" className="flex-1 overflow-y-auto p-3">
      {adminNav.map((group, i) => {
        const items = group.items.filter((item) => !item.adminOnly || role === "admin")
        if (!items.length) return null
        return (
          <div key={i} className={cn(i > 0 && "mt-5")}>
            {group.title && !collapsed && <p className="mb-1.5 px-3 font-mono text-[11px] tracking-widest text-muted-foreground uppercase">{group.title}</p>}
            {group.title && collapsed && <div className="mx-auto mb-2 h-px w-6 bg-border" />}
            <ul className="flex flex-col gap-0.5">
              {items.map((item) => {
                const active = isNavActive(pathname, item)
                const link = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex h-9 items-center gap-3 rounded-lg text-sm font-medium transition-colors",
                      collapsed ? "justify-center" : "px-3",
                      active ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-[18px] shrink-0" aria-hidden />
                    {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
                  </Link>
                )
                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
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
