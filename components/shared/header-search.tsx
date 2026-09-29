"use client"

import { Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

/** Debounced search box: typing updates /search?q= after a short pause. */
export function HeaderSearch({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const initial = pathname === "/search" ? (params.get("q") ?? "") : ""
  const [value, setValue] = useState(initial)
  const touched = useRef(false)

  // Keep the box in sync when the URL changes (e.g. back button).
  useEffect(() => {
    if (!touched.current) setValue(initial)
  }, [initial])

  useEffect(() => {
    if (!touched.current) return
    const q = value.trim()
    if (q.length < 2) return
    const id = setTimeout(() => {
      const url = `/search?q=${encodeURIComponent(q)}`
      if (pathname === "/search") router.replace(url, { scroll: false })
      else router.push(url)
    }, 400)
    return () => clearTimeout(id)
  }, [value, pathname, router])

  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault()
        const q = value.trim()
        if (!q) return
        router.push(`/search?q=${encodeURIComponent(q)}`)
        onNavigate?.()
      }}
    >
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => {
          touched.current = true
          setValue(e.target.value)
        }}
        placeholder="Search articles…"
        aria-label="Search articles"
        className="h-9 w-full rounded-full border bg-muted/40 pr-4 pl-9 text-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:bg-background focus:ring-3 focus:ring-ring/30"
      />
    </form>
  )
}
