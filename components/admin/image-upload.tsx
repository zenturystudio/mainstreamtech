"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadImage } from "@/lib/storage"
import { cn } from "@/lib/utils"

type Props = {
  value: string | null
  onChange: (url: string | null) => void
  label?: string
  aspect?: string
  className?: string
  /** Round preview, for avatars. */
  round?: boolean
}

/** Single-image field: drag & drop or click to upload to Supabase Storage, with preview and remove. */
export function ImageUpload({ value, onChange, label = "Upload image", aspect = "aspect-[16/9]", className, round }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [dragging, setDragging] = useState(false)

  async function handle(file: File | undefined) {
    if (!file) return
    setBusy(true)
    try {
      const { url } = await uploadImage(file)
      onChange(url)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ""
    }
  }

  return (
    <div className={className}>
      <input ref={input} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => handle(e.target.files?.[0])} />
      {value ? (
        <div className="flex flex-col gap-2">
          <div className={cn("relative overflow-hidden border bg-muted", round ? "size-24 rounded-full" : cn(aspect, "rounded-xl"))}>
            <Image src={value} alt="" fill sizes="400px" className="object-cover" />
            {busy && (
              <div className="absolute inset-0 grid place-items-center bg-background/70">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => input.current?.click()}>
              <RefreshCw /> Replace
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => onChange(null)} className="text-muted-foreground hover:text-destructive">
              <Trash2 /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            handle(e.dataTransfer.files?.[0])
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
            round ? "size-24 rounded-full" : cn(aspect, "rounded-xl"),
            dragging && "border-brand bg-brand/5 text-brand"
          )}
        >
          {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-6" aria-hidden />}
          {!round && (
            <span className="px-4 text-center">
              <span className="font-medium text-foreground">{busy ? "Uploading…" : label}</span>
              <br />
              <span className="text-xs">Drag & drop or click · max 5 MB</span>
            </span>
          )}
          {round && <span className="sr-only">{label}</span>}
        </button>
      )}
    </div>
  )
}
