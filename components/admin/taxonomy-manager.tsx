"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { AdminEmpty } from "@/components/admin/page-heading"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { deleteCategory, deleteTag, saveCategory, saveTag } from "@/lib/actions/taxonomy"
import { slugify } from "@/lib/utils"
import { categorySchema, tagSchema } from "@/lib/validations/cms"
import type { z } from "zod"

type Kind = "category" | "tag"
type Item = { id: string; name: string; slug: string; description?: string | null; postCount: number }
type FormValues = z.input<typeof categorySchema>

const NONE = "__none__"

export function TaxonomyManager({ kind, items, canEdit, siteBase }: { kind: Kind; items: Item[]; canEdit: boolean; siteBase: string }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<Item | null | "new">(null)
  const label = kind === "category" ? "category" : "tag"

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? items.filter((i) => i.name.toLowerCase().includes(q) || i.slug.includes(q)) : items
  }, [items, query])

  async function remove(item: Item, reassignTo: string | null) {
    const result = kind === "category" ? await deleteCategory(item.id, reassignTo) : await deleteTag(item.id)
    if (!result.success) {
      toast.error(result.error)
      return false
    }
    toast.success(`Deleted “${item.name}”`)
    router.refresh()
  }

  return (
    <div className="rounded-2xl border bg-background">
      <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${kind === "category" ? "categories" : "tags"}…`} className="h-9 pl-9" aria-label="Search" />
        </div>
        {canEdit && (
          <Button onClick={() => setEditing("new")} className="h-9">
            <Plus /> Add {label}
          </Button>
        )}
      </div>

      {filtered.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Name</TableHead>
              <TableHead>Slug</TableHead>
              {kind === "category" && <TableHead className="hidden md:table-cell">Description</TableHead>}
              <TableHead className="text-right">Posts</TableHead>
              {canEdit && <TableHead className="w-24 pr-5 text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="pl-5 font-medium">
                  <a href={`${siteBase}/${kind}/${item.slug}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand hover:underline">
                    {item.name}
                  </a>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">{item.slug}</TableCell>
                {kind === "category" && (
                  <TableCell className="hidden max-w-sm truncate text-muted-foreground md:table-cell">{item.description || "—"}</TableCell>
                )}
                <TableCell className="text-right tabular-nums">{item.postCount}</TableCell>
                {canEdit && (
                  <TableCell className="pr-5 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(item)} aria-label={`Edit ${item.name}`}>
                        <Pencil />
                      </Button>
                      <DeleteButton item={item} kind={kind} others={items.filter((i) => i.id !== item.id)} onDelete={remove} />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <AdminEmpty
          title={query ? "No matches" : `No ${kind === "category" ? "categories" : "tags"} yet`}
          description={query ? "Try a different search." : canEdit ? `Add your first ${label} to organise posts.` : undefined}
        />
      )}

      {canEdit && (
        <ItemDialog
          kind={kind}
          item={editing === "new" ? null : editing}
          open={editing !== null}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            router.refresh()
          }}
        />
      )}
    </div>
  )
}

function DeleteButton({ item, kind, others, onDelete }: { item: Item; kind: Kind; others: Item[]; onDelete: (item: Item, reassignTo: string | null) => Promise<boolean | void> }) {
  const [reassignTo, setReassignTo] = useState<string>(others[0]?.id ?? NONE)
  const inUse = kind === "category" && item.postCount > 0

  return (
    <ConfirmDialog
      trigger={
        <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" aria-label={`Delete ${item.name}`}>
          <Trash2 />
        </Button>
      }
      title={`Delete “${item.name}”?`}
      description={
        inUse ? (
          <span className="flex flex-col gap-3">
            <span>
              {item.postCount} {item.postCount === 1 ? "post uses" : "posts use"} this category. Choose where to move {item.postCount === 1 ? "it" : "them"}:
            </span>
            <Select value={reassignTo} onValueChange={setReassignTo}>
              <SelectTrigger className="w-full" aria-label="Move posts to">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {others.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
                <SelectItem value={NONE}>No category</SelectItem>
              </SelectContent>
            </Select>
          </span>
        ) : kind === "tag" && item.postCount > 0 ? (
          `It will be removed from ${item.postCount} ${item.postCount === 1 ? "post" : "posts"}. This can't be undone.`
        ) : (
          "This can't be undone."
        )
      }
      confirmLabel={inUse ? "Move posts & delete" : "Delete"}
      onConfirm={() => onDelete(item, reassignTo === NONE ? null : reassignTo)}
    />
  )
}

function ItemDialog({ kind, item, open, onClose, onSaved }: { kind: Kind; item: Item | null; open: boolean; onClose: () => void; onSaved: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* Keyed so the form resets whenever a different item is opened. */}
        {open && <ItemForm key={item?.id ?? "new"} kind={kind} item={item} onCancel={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  )
}

function ItemForm({ kind, item, onCancel, onSaved }: { kind: Kind; item: Item | null; onCancel: () => void; onSaved: () => void }) {
  const [slugTouched, setSlugTouched] = useState(Boolean(item))
  const form = useForm<FormValues>({
    resolver: zodResolver(kind === "category" ? categorySchema : (tagSchema as unknown as typeof categorySchema)),
    defaultValues: { name: item?.name ?? "", slug: item?.slug ?? "", description: item?.description ?? "" },
  })
  const { errors, isSubmitting } = form.formState
  const label = kind === "category" ? "category" : "tag"

  async function onSubmit(values: FormValues) {
    const payload = kind === "category" ? values : { name: values.name, slug: values.slug }
    const result = kind === "category" ? await saveCategory(item?.id ?? null, payload) : await saveTag(item?.id ?? null, payload)
    if (!result.success) {
      toast.error(result.error)
      return
    }
    toast.success(item ? `Saved “${values.name}”` : `Created “${values.name}”`)
    onSaved()
  }

  const nameField = form.register("name")

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle className="font-sans">{item ? `Edit ${label}` : `New ${label}`}</DialogTitle>
        <DialogDescription>{kind === "category" ? "Categories group posts into sections of the site." : "Tags describe topics across sections."}</DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tx-name">Name</Label>
        <Input
          id="tx-name"
          autoFocus
          aria-invalid={Boolean(errors.name)}
          {...nameField}
          onChange={(e) => {
            nameField.onChange(e)
            if (!slugTouched) form.setValue("slug", slugify(e.target.value), { shouldValidate: form.formState.isSubmitted })
          }}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="tx-slug">Slug</Label>
        <Input id="tx-slug" className="font-mono text-sm" aria-invalid={Boolean(errors.slug)} {...form.register("slug", { onChange: () => setSlugTouched(true) })} />
        {errors.slug ? <p className="text-sm text-destructive">{errors.slug.message}</p> : <p className="text-xs text-muted-foreground">Used in the URL: /{kind}/{form.watch("slug") || "…"}</p>}
      </div>

      {kind === "category" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="tx-description">Description</Label>
          <Textarea id="tx-description" rows={3} {...form.register("description")} />
          {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          {item ? "Save changes" : `Create ${label}`}
        </Button>
      </DialogFooter>
    </form>
  )
}
