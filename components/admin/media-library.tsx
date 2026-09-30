"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Check, Copy, ImageIcon, Loader2, Search, Trash2, Upload } from "lucide-react"
import { ConfirmDialog } from "@/components/admin/confirm-dialog"
import { AdminEmpty } from "@/components/admin/page-heading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { deleteMedia } from "@/lib/actions/admin"
import { uploadImage, validateImage, type MediaFolder } from "@/lib/storage"
import { cn, formatDate } from "@/lib/utils"
import type { MediaItem } from "@/lib/queries/media"

const formatSize = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`)

type Props = {
  items: MediaItem[]
  userId: string
  isAdmin: boolean
  /** Where new uploads go. */
  folder: MediaFolder
  /** Label each image Blog/General (the "All media" view). */
  showFolder?: boolean
}

export function MediaLibrary({ items, userId, isAdmin, folder, showFolder }: Props) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [query, setQuery] = useState("")
  const [copied, setCopied] = useState<string | null>(null)

  async function upload(files: FileList | File[]) {
    const list = [...files]
    const invalid = list.map(validateImage).filter(Boolean)
    invalid.forEach((msg) => toast.error(msg))
    const valid = list.filter((f) => !validateImage(f))
    if (!valid.length) return

    setUploading(valid.length)
    const results = await Promise.allSettled(valid.map((f) => uploadImage(f, folder)))
    setUploading(0)
    const ok = results.filter((r) => r.status === "fulfilled").length
    results.forEach((r) => r.status === "rejected" && toast.error(r.reason instanceof Error ? r.reason.message : "Upload failed"))
    if (ok) toast.success(ok === 1 ? "Image uploaded" : `${ok} images uploaded`)
    if (input.current) input.current.value = ""
    router.refresh()
  }

  async function copy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(url)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error("Couldn't copy the URL")
    }
  }

  const filtered = query.trim() ? items.filter((i) => i.name.toLowerCase().includes(query.trim().toLowerCase())) : items

  return (
    <div className="flex flex-col gap-6">
      <input ref={input} type="file" accept="image/*" multiple className="sr-only" tabIndex={-1} onChange={(e) => e.target.files && upload(e.target.files)} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files)
        }}
        disabled={uploading > 0}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed bg-background px-6 py-10 text-center transition-colors hover:border-foreground/30 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          dragging && "border-brand bg-brand/5"
        )}
      >
        <span className="grid size-12 place-items-center rounded-full bg-brand/10 text-brand">
          {uploading ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" aria-hidden />}
        </span>
        <span className="font-medium">{uploading ? `Uploading ${uploading} ${uploading === 1 ? "image" : "images"}…` : folder === "blog" ? "Drop blog images here or click to upload" : "Drop images here or click to upload"}</span>
        <span className="text-sm text-muted-foreground">JPG, PNG, WebP, GIF or AVIF · max 5 MB each</span>
      </button>

      <div className="rounded-2xl border bg-background">
        <div className="flex items-center justify-between gap-3 border-b p-4">
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files…" className="h-9 pl-9" aria-label="Search files" />
          </div>
          <p className="shrink-0 text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "file" : "files"}
          </p>
        </div>

        {filtered.length ? (
          <ul className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filtered.map((item) => {
              const canDelete = isAdmin || item.ownerId === userId
              return (
                <li key={item.path} className="group overflow-hidden rounded-xl border">
                  <div className="relative aspect-square bg-muted">
                    <Image src={item.url} alt={item.name} fill sizes="(min-width: 1280px) 220px, (min-width: 640px) 30vw, 45vw" className="object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-end gap-1 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                      <Button size="icon-sm" variant="secondary" onClick={() => copy(item.url)} aria-label={`Copy URL of ${item.name}`}>
                        {copied === item.url ? <Check /> : <Copy />}
                      </Button>
                      {canDelete && (
                        <ConfirmDialog
                          trigger={
                            <Button size="icon-sm" variant="secondary" className="hover:text-destructive" aria-label={`Delete ${item.name}`}>
                              <Trash2 />
                            </Button>
                          }
                          title={`Delete “${item.name}”?`}
                          description="Any post still using this image will show a broken image. This can't be undone."
                          onConfirm={async () => {
                            const result = await deleteMedia([item.path])
                            if (!result.success) {
                              toast.error(result.error)
                              return false
                            }
                            toast.success("Image deleted")
                            router.refresh()
                          }}
                        />
                      )}
                    </div>
                  </div>
                  <div className="px-3 py-2">
                    {showFolder && (
                      <span
                        className={cn(
                          "mb-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          item.folder === "blog" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.folder === "blog" ? "Blog" : "General"}
                      </span>
                    )}
                    <p className="truncate text-sm font-medium" title={item.name}>
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(item.size)}
                      {item.createdAt && ` · ${formatDate(item.createdAt, "d MMM yyyy")}`}
                    </p>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <AdminEmpty icon={ImageIcon} title={query ? "No matching files" : folder === "blog" ? "No blog images yet" : "No images yet"}
            description={query ? undefined : folder === "blog" ? "Images you upload here, plus covers and images added in the post editor, appear here." : "Uploads from the editor and this page appear here."} />
        )}
      </div>
    </div>
  )
}
