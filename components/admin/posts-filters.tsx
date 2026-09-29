"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Option = { id: string; name: string }
const ALL = "__all__"

/** Filter bar for the posts table. State lives in the URL so views are shareable and server-rendered. */
export function PostsFilters({ categories, authors }: { categories: Option[]; authors: Option[] | null }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [q, setQ] = useState(params.get("q") ?? "")

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v && v !== ALL) next.set(k, v)
      else next.delete(k)
    }
    next.delete("page") // any filter change returns to page 1
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }))
  }

  // Debounced title search.
  useEffect(() => {
    if (q === (params.get("q") ?? "")) return
    const t = setTimeout(() => update({ q: q.trim() || null }), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  const hasFilters = ["q", "status", "category", "author", "sort"].some((k) => params.get(k))

  return (
    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center">
      <div className="relative w-full lg:max-w-xs">
        {pending ? (
          <Loader2 className="absolute top-1/2 left-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" aria-hidden />
        ) : (
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        )}
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles…" className="h-9 pl-9" aria-label="Search posts by title" />
      </div>
      <div className="flex flex-wrap gap-2">
        <FilterSelect label="Status" value={params.get("status")} onChange={(v) => update({ status: v })} options={[{ id: "draft", name: "Draft" }, { id: "published", name: "Published" }, { id: "scheduled", name: "Scheduled" }]} />
        <FilterSelect label="Section" value={params.get("category")} onChange={(v) => update({ category: v })} options={categories} />
        {authors && <FilterSelect label="Author" value={params.get("author")} onChange={(v) => update({ author: v })} options={authors} />}
        <Select value={params.get("sort") ?? "updated"} onValueChange={(v) => update({ sort: v === "updated" ? null : v })}>
          <SelectTrigger className="h-9 w-40" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last updated</SelectItem>
            <SelectItem value="published">Publish date</SelectItem>
            <SelectItem value="views">Most views</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9"
            onClick={() => {
              setQ("")
              startTransition(() => router.replace(pathname, { scroll: false }))
            }}
          >
            <X /> Clear
          </Button>
        )}
      </div>
    </div>
  )
}

function FilterSelect({ label, value, onChange, options }: { label: string; value: string | null; onChange: (v: string) => void; options: Option[] }) {
  return (
    <Select value={value ?? ALL} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-40" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>All {label === "Status" ? "statuses" : label === "Section" ? "sections" : "authors"}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
