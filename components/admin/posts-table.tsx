"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Copy, ExternalLink, FileText, MoreHorizontal, Pencil, Plus, Star, Trash2 } from "lucide-react"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { AdminEmpty } from "@/components/admin/page-heading"
import { StatusBadge } from "@/components/admin/status-badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { deletePosts, duplicatePost } from "@/lib/actions/posts"
import { effectiveStatus, type PostStatus } from "@/lib/posts"
import { formatDate, timeAgo } from "@/lib/utils"
import type { AdminPostRow } from "@/lib/queries/admin"
import { siteConfig } from "@/lib/site"
import { postPath } from "@/lib/urls"

export function PostsTable({ posts, siteBase, showAuthor, filtered }: { posts: AdminPostRow[]; siteBase: string; showAuthor: boolean; filtered: boolean }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const allSelected = posts.length > 0 && selected.size === posts.length

  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  async function remove(ids: string[]) {
    const result = await deletePosts(ids)
    if (!result.success) toast.error(result.error)
    else toast.success(ids.length === 1 ? "Post deleted" : `${ids.length} posts deleted`)
    setSelected(new Set())
    router.refresh()
  }

  async function duplicate(id: string) {
    const result = await duplicatePost(id)
    if (!result.success) return toast.error(result.error)
    toast.success("Duplicated as a draft")
    router.push(`/admin/posts/${result.id}/edit`)
  }

  if (!posts.length) {
    return filtered ? (
      <AdminEmpty icon={FileText} title="No posts match these filters" description="Try clearing a filter or searching for something else." />
    ) : (
      <AdminEmpty
        icon={FileText}
        title="No posts yet"
        description="Your stories will appear here."
        action={
          <Button asChild size="sm">
            <Link href="/admin/posts/new">
              <Plus /> Write your first post
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <>
      {selected.size > 0 && (
        <div className="flex items-center gap-3 border-b bg-brand/5 px-4 py-2.5 text-sm">
          <span className="font-medium">{selected.size} selected</span>
          <ConfirmDialog
            trigger={
              <Button variant="destructive" size="sm">
                <Trash2 /> Delete selected
              </Button>
            }
            title={`Delete ${selected.size} ${selected.size === 1 ? "post" : "posts"}?`}
            description="They'll be removed from the site immediately. This can't be undone."
            onConfirm={() => remove([...selected])}
          />
          <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
            Clear selection
          </Button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 pl-4">
              <Checkbox
                checked={allSelected ? true : selected.size ? "indeterminate" : false}
                onCheckedChange={(v) => setSelected(v ? new Set(posts.map((p) => p.id)) : new Set())}
                aria-label="Select all posts on this page"
              />
            </TableHead>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Status</TableHead>
            <TableHead className="hidden lg:table-cell">Category</TableHead>
            {showAuthor && <TableHead className="hidden xl:table-cell">Author</TableHead>}
            <TableHead className="hidden text-right sm:table-cell">Views</TableHead>
            <TableHead className="hidden lg:table-cell">Date</TableHead>
            <TableHead className="w-12 pr-4">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => {
            const live = effectiveStatus(post.status as PostStatus, post.published_at) === "published"
            return (
              <TableRow key={post.id} data-state={selected.has(post.id) ? "selected" : undefined}>
                <TableCell className="pl-4">
                  <Checkbox checked={selected.has(post.id)} onCheckedChange={() => toggle(post.id)} aria-label={`Select “${post.title}”`} />
                </TableCell>
                <TableCell className="max-w-0 min-w-56 whitespace-normal">
                  <Link href={`/admin/posts/${post.id}/edit`} className="line-clamp-2 font-medium hover:text-brand">
                    {post.featured && <Star className="mr-1 mb-0.5 inline size-3.5 fill-amber-400 text-amber-400" aria-label="Featured" />}
                    {post.title}
                  </Link>
                  <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">/{post.slug}</p>
                  <div className="mt-1.5 md:hidden">
                    <StatusBadge status={post.status as PostStatus} publishedAt={post.published_at} />
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <StatusBadge status={post.status as PostStatus} publishedAt={post.published_at} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{post.category?.name ?? "—"}</TableCell>
                {showAuthor && <TableCell className="hidden text-muted-foreground xl:table-cell">{post.author?.full_name ?? siteConfig.name}</TableCell>}
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{post.views.toLocaleString("en-GB")}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                  {post.status === "draft" ? (
                    <span title={formatDate(post.updated_at, "d MMM yyyy, HH:mm")}>Edited {timeAgo(post.updated_at)}</span>
                  ) : post.published_at ? (
                    formatDate(post.published_at, "d MMM yyyy, HH:mm")
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="pr-4">
                  <RowActions post={post} live={live} siteBase={siteBase} onDuplicate={duplicate} onDelete={remove} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </>
  )
}

function RowActions({
  post,
  live,
  siteBase,
  onDuplicate,
  onDelete,
}: {
  post: AdminPostRow
  live: boolean
  siteBase: string
  onDuplicate: (id: string) => void
  onDelete: (ids: string[]) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Actions for “${post.title}”`}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={`/admin/posts/${post.id}/edit`}>
              <Pencil /> Edit
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href={live ? `${siteBase}${postPath(post.slug)}` : `/preview/${post.id}`} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> {live ? "View" : "Preview"}
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onDuplicate(post.id)}>
            <Copy /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirming(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {confirming && (
        <ControlledConfirm
          title={`Delete “${post.title}”?`}
          onCancel={() => setConfirming(false)}
          onConfirm={async () => {
            await onDelete([post.id])
            setConfirming(false)
          }}
        />
      )}
    </>
  )
}

/** Opened from a dropdown item, so it can't use a trigger element. */
function ControlledConfirm({ title, onCancel, onConfirm }: { title: string; onCancel: () => void; onConfirm: () => Promise<void> }) {
  return (
    <ConfirmDialog
      defaultOpen
      onOpenChange={(o) => !o && onCancel()}
      title={title}
      description="It'll be removed from the site immediately. This can't be undone."
      onConfirm={onConfirm}
    />
  )
}
