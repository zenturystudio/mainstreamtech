"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Mail, Search, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { AdminEmpty } from "@/components/admin/page-heading"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { deleteSubscribers } from "@/lib/actions/admin"
import { formatDate } from "@/lib/utils"

type Subscriber = { id: string; email: string; created_at: string }

export function SubscribersTable({ subscribers }: { subscribers: Subscriber[] }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? subscribers.filter((s) => s.email.includes(q)) : subscribers
  }, [subscribers, query])

  async function remove(ids: string[]) {
    const result = await deleteSubscribers(ids)
    if (!result.success) {
      toast.error(result.error)
      return false
    }
    toast.success(ids.length === 1 ? "Subscriber removed" : `${ids.length} subscribers removed`)
    setSelected(new Set())
    router.refresh()
  }

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div className="overflow-hidden rounded-2xl border bg-background">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search emails…" className="h-9 pl-9" aria-label="Search subscribers" />
        </div>
        {selected.size > 0 && (
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 /> Remove {selected.size}
              </Button>
            }
            title={`Remove ${selected.size} ${selected.size === 1 ? "subscriber" : "subscribers"}?`}
            description="They'll stop receiving the newsletter. This can't be undone."
            confirmLabel="Remove"
            onConfirm={() => remove([...selected])}
          />
        )}
      </div>

      {filtered.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 pl-4">
                <Checkbox
                  checked={selected.size === filtered.length ? true : selected.size ? "indeterminate" : false}
                  onCheckedChange={(v) => setSelected(v ? new Set(filtered.map((s) => s.id)) : new Set())}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead className="w-12 pr-4">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow key={s.id} data-state={selected.has(s.id) ? "selected" : undefined}>
                <TableCell className="pl-4">
                  <Checkbox checked={selected.has(s.id)} onCheckedChange={() => toggle(s.id)} aria-label={`Select ${s.email}`} />
                </TableCell>
                <TableCell className="font-medium">{s.email}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(s.created_at, "d MMM yyyy")}</TableCell>
                <TableCell className="pr-4">
                  <ConfirmDialog
                    trigger={
                      <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${s.email}`}>
                        <Trash2 />
                      </Button>
                    }
                    title={`Remove ${s.email}?`}
                    description="They'll stop receiving the newsletter."
                    confirmLabel="Remove"
                    onConfirm={() => remove([s.id])}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <AdminEmpty icon={Mail} title={query ? "No matching subscribers" : "No subscribers yet"} description={query ? undefined : "Sign-ups from the newsletter forms on the site appear here."} />
      )}
    </div>
  )
}
