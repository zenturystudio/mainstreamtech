"use client"

import Link from "next/link"
import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { ArrowLeft, Check, CircleAlert, ExternalLink, Eye, Loader2, Save } from "lucide-react"
import { FaqEditor } from "@/components/admin/editor/faq-editor"
import { ImageUpload } from "@/components/admin/image-upload"
import { RichTextEditor } from "@/components/admin/editor/rich-text-editor"
import { TagPicker } from "@/components/admin/tag-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { isSlugAvailable, savePost } from "@/lib/actions/posts"
import type { PostStatus } from "@/lib/posts"
import type { Faq } from "@/types/app"
import { cn, readingTime, slugify, timeAgo } from "@/lib/utils"
import { postPath } from "@/lib/urls"

export type EditorPost = {
  id: string | null
  title: string
  slug: string
  excerpt: string
  content: string
  cover_image_url: string | null
  status: PostStatus
  published_at: string | null
  category_id: string
  tag_ids: string[]
  featured: boolean
  meta_title: string
  meta_description: string
  faqs: Faq[]
  updated_at: string | null
}

type Values = Omit<EditorPost, "id" | "updated_at">
type Option = { id: string; name: string; slug: string }

const AUTOSAVE_MS = 30_000
const NO_CATEGORY = "__none__"

/** ISO → value for <input type="datetime-local"> in the user's timezone. */
function toLocalInput(iso: string | null) {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function PostEditor({ post, categories, tags, siteBase }: { post: EditorPost; categories: Option[]; tags: Option[]; siteBase: string }) {
  const router = useRouter()
  const [postId, setPostId] = useState(post.id)
  const [savedStatus, setSavedStatus] = useState<PostStatus>(post.status)
  const [savedSlug, setSavedSlug] = useState(post.slug)
  const [lastSaved, setLastSaved] = useState<string | null>(post.updated_at)
  const [saving, setSaving] = useState<"manual" | "auto" | null>(null)
  const [slugTouched, setSlugTouched] = useState(Boolean(post.id))
  const [slugState, setSlugState] = useState<"idle" | "checking" | "ok" | "taken">("idle")

  const form = useForm<Values>({
    defaultValues: {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      cover_image_url: post.cover_image_url,
      status: post.status,
      published_at: post.published_at,
      category_id: post.category_id,
      tag_ids: post.tag_ids,
      featured: post.featured,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      faqs: post.faqs,
    },
  })
  const { control, register, setValue, getValues, formState } = form
  const values = useWatch({ control }) as Values

  // ---- Slug: auto-generate from title, check uniqueness (debounced) -------
  useEffect(() => {
    const slug = values.slug
    if (!slug || slug === savedSlug) {
      setSlugState("idle")
      return
    }
    setSlugState("checking")
    const t = setTimeout(async () => setSlugState((await isSlugAvailable(slug, postId)) ? "ok" : "taken"), 450)
    return () => clearTimeout(t)
  }, [values.slug, savedSlug, postId])

  // ---- Save ---------------------------------------------------------------
  const save = useCallback(
    /** Returns the saved post id, or null on failure. */
    async (status: PostStatus, mode: "manual" | "auto" = "manual"): Promise<string | null> => {
      const v = getValues()
      if (!v.title.trim()) {
        if (mode === "manual") toast.error("Add a title before saving.")
        return null
      }
      setSaving(mode)
      const result = await savePost(postId, {
        ...v,
        status,
        slug: v.slug || slugify(v.title),
        category_id: v.category_id || null,
        published_at: v.published_at ? new Date(v.published_at).toISOString() : null,
        tag_ids: v.tag_ids,
        // Drop pairs left completely blank; half-filled ones are rejected with a message.
        faqs: v.faqs.filter((f) => f.question.trim() || f.answer.trim()),
      })
      setSaving(null)

      if (!result.success) {
        if (mode === "manual") toast.error(result.error)
        return null
      }

      // Adopt server-normalised values and mark the form clean.
      const next: Values = { ...v, status: result.status as PostStatus, slug: result.slug, published_at: result.publishedAt }
      form.reset(next)
      setSavedStatus(result.status as PostStatus)
      setSavedSlug(result.slug)
      setLastSaved(new Date().toISOString())

      if (!postId) {
        setPostId(result.id)
        // Swap the URL to the edit route without remounting the editor.
        window.history.replaceState(null, "", `/admin/posts/${result.id}/edit`)
      }
      if (mode === "manual") {
        const messages: Record<PostStatus, string> = {
          draft: "Draft saved",
          published: savedStatus === "published" ? "Post updated" : "Post published 🎉",
          scheduled: "Post scheduled",
        }
        toast.success(messages[result.status as PostStatus])
        router.refresh()
      }
      return result.id
    },
    [form, getValues, postId, router, savedStatus]
  )

  // ---- Autosave drafts every 30s -------------------------------------------
  const dirtyRef = useRef(false)
  dirtyRef.current = formState.isDirty
  useEffect(() => {
    const t = setInterval(() => {
      if (dirtyRef.current && savedStatus === "draft" && getValues("status") === "draft" && !saving) void save("draft", "auto")
    }, AUTOSAVE_MS)
    return () => clearInterval(t)
  }, [save, savedStatus, saving, getValues])

  // ---- Warn before leaving with unsaved changes ----------------------------
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return
      e.preventDefault()
      e.returnValue = ""
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  const confirmLeave = (e: React.MouseEvent) => {
    if (dirtyRef.current && !window.confirm("You have unsaved changes. Leave anyway?")) e.preventDefault()
  }

  // Ctrl/Cmd+S saves with the currently selected status.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault()
        void save(getValues("status"))
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [save, getValues])

  const status = values.status
  const primaryLabel =
    status === "draft"
      ? savedStatus === "draft"
        ? "Save draft"
        : "Unpublish"
      : status === "scheduled"
        ? "Schedule"
        : savedStatus === "published"
          ? "Update"
          : "Publish"

  const words = values.content ? values.content.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length : 0
  const liveHref = `${siteBase}${postPath(savedSlug)}`

  return (
    <form onSubmit={(e) => e.preventDefault()} className="mx-auto max-w-7xl">
      {/* ---- Header bar ---- */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href="/admin/posts" onClick={confirmLeave}>
            <ArrowLeft /> Posts
          </Link>
        </Button>
        <SaveIndicator saving={saving} dirty={formState.isDirty} lastSaved={lastSaved} />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {postId && savedStatus !== "draft" && (
            <Button asChild variant="ghost" size="sm">
              <a href={liveHref} target="_blank" rel="noopener noreferrer">
                View live <ExternalLink />
              </a>
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9"
            disabled={saving !== null}
            onClick={async () => {
              // Open synchronously (popup blockers), then point it at the preview
              // once the latest changes are saved.
              const win = window.open("about:blank", "_blank")
              let id = postId
              if (!id || formState.isDirty) id = await save(savedStatus, "manual")
              if (!id) return win?.close()
              if (win) {
                win.opener = null
                win.location.href = `/preview/${id}`
              }
            }}
          >
            <Eye /> Preview
          </Button>
          {status !== "draft" && savedStatus === "draft" && (
            <Button type="button" variant="outline" size="sm" className="h-9" disabled={saving !== null} onClick={() => save("draft")}>
              Save draft
            </Button>
          )}
          <Button type="button" size="sm" className="h-9 px-4" disabled={saving !== null || slugState === "taken"} onClick={() => save(status)}>
            {saving === "manual" ? <Loader2 className="animate-spin" /> : <Save />}
            {primaryLabel}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ---- Main column ---- */}
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <label htmlFor="post-title" className="sr-only">
              Title
            </label>
            <Textarea
              id="post-title"
              rows={1}
              placeholder="Post title"
              className="field-sizing-content min-h-0 resize-none border-0 bg-transparent px-0 font-heading text-3xl leading-tight font-bold shadow-none focus-visible:ring-0 md:text-4xl dark:bg-transparent"
              {...register("title", {
                onChange: (e) => {
                  if (!slugTouched) setValue("slug", slugify(e.target.value), { shouldDirty: true })
                },
              })}
            />
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
              <span className="shrink-0">{siteBase.replace(/^https?:\/\//, "")}/</span>
              <input
                aria-label="Slug"
                className="min-w-40 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-0.5 font-mono text-sm text-foreground hover:border-border focus:border-ring focus:outline-none"
                {...register("slug", {
                  onChange: (e) => {
                    setSlugTouched(true)
                    setValue("slug", slugify(e.target.value) + (e.target.value.endsWith("-") ? "-" : ""))
                  },
                  onBlur: (e) => setValue("slug", slugify(e.target.value)),
                })}
              />
              <SlugStatus state={slugState} />
            </div>
          </div>

          <Controller control={control} name="content" render={({ field }) => <RichTextEditor value={field.value} onChange={field.onChange} />} />
          <p className="-mt-3 text-right text-xs text-muted-foreground tabular-nums">
            {words.toLocaleString("en-GB")} {words === 1 ? "word" : "words"} · {readingTime(values.content || "")} min read
          </p>

          <Section title="Excerpt" hint="Shown on cards and in search results. 1–2 sentences.">
            <Textarea rows={3} maxLength={400} aria-label="Excerpt" {...register("excerpt")} />
            <Counter value={values.excerpt} max={400} />
          </Section>

          <Section title="FAQs" hint="Optional. Shown at the end of the story and added as FAQ schema for Google.">
            <Controller control={control} name="faqs" render={({ field }) => <FaqEditor value={field.value} onChange={field.onChange} />} />
          </Section>
        </div>

        {/* ---- Sidebar ---- */}
        <aside className="flex flex-col gap-5">
          <Section title="Publishing">
            <div className="flex flex-col gap-2">
              <Label htmlFor="post-status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v as PostStatus)}>
                    <SelectTrigger id="post-status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            {status === "scheduled" && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="post-date">Publish on</Label>
                <Input
                  id="post-date"
                  type="datetime-local"
                  value={toLocalInput(values.published_at)}
                  min={toLocalInput(new Date().toISOString())}
                  onChange={(e) => setValue("published_at", e.target.value ? new Date(e.target.value).toISOString() : null, { shouldDirty: true })}
                />
                <p className="text-xs text-muted-foreground">Goes live automatically at this time ({Intl.DateTimeFormat().resolvedOptions().timeZone}).</p>
              </div>
            )}
            {status === "published" && values.published_at && savedStatus === "published" && (
              <p className="text-xs text-muted-foreground">Published {new Date(values.published_at).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p>
            )}
            <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
              <div>
                <Label htmlFor="post-featured">Featured</Label>
                <p className="text-xs text-muted-foreground">Show in the homepage hero.</p>
              </div>
              <Controller control={control} name="featured" render={({ field }) => <Switch id="post-featured" checked={field.value} onCheckedChange={field.onChange} />} />
            </div>
          </Section>

          <Section title="Category & tags">
            <div className="flex flex-col gap-2">
              <Label htmlFor="post-category">Category</Label>
              <Controller
                control={control}
                name="category_id"
                render={({ field }) => (
                  <Select value={field.value || NO_CATEGORY} onValueChange={(v) => field.onChange(v === NO_CATEGORY ? "" : v)}>
                    <SelectTrigger id="post-category" className="w-full">
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY}>No category</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tags</Label>
              <Controller control={control} name="tag_ids" render={({ field }) => <TagPicker tags={tags} value={field.value} onChange={field.onChange} />} />
            </div>
          </Section>

          <Section title="Cover image">
            <Controller control={control} name="cover_image_url" render={({ field }) => <ImageUpload value={field.value} onChange={(url) => field.onChange(url)} label="Upload cover image" folder="blog" />} />
          </Section>

          <Section title="SEO" hint="Leave blank to use the title and excerpt.">
            <div className="flex flex-col gap-2">
              <Label htmlFor="meta-title">Meta title</Label>
              <Input id="meta-title" maxLength={70} placeholder={values.title} {...register("meta_title")} />
              <Counter value={values.meta_title} max={60} hardMax={70} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="meta-description">Meta description</Label>
              <Textarea id="meta-description" rows={3} maxLength={170} placeholder={values.excerpt} {...register("meta_description")} />
              <Counter value={values.meta_description} max={160} hardMax={170} />
            </div>
            <GooglePreview
              url={`${siteBase.replace(/^https?:\/\//, "")} › blog › ${values.slug || "…"}`}
              title={values.meta_title || values.title || "Post title"}
              description={values.meta_description || values.excerpt || "Add an excerpt or meta description to control what appears here."}
            />
          </Section>
        </aside>
      </div>
    </form>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border bg-background p-5">
      <div>
        <h2 className="font-sans text-sm font-semibold">{title}</h2>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function Counter({ value, max, hardMax }: { value: string | null | undefined; max: number; hardMax?: number }) {
  const n = value?.length ?? 0
  const over = n > max
  return (
    <p className={cn("text-right text-xs tabular-nums", over ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
      {n}/{max}
      {over && hardMax ? " · may be truncated" : ""}
    </p>
  )
}

function SlugStatus({ state }: { state: "idle" | "checking" | "ok" | "taken" }) {
  if (state === "checking") return <Loader2 className="size-3.5 animate-spin" aria-label="Checking slug" />
  if (state === "ok")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <Check className="size-3.5" aria-hidden /> Available
      </span>
    )
  if (state === "taken")
    return (
      <span role="alert" className="inline-flex items-center gap-1 text-xs text-destructive">
        <CircleAlert className="size-3.5" aria-hidden /> Already used by another post
      </span>
    )
  return null
}

function SaveIndicator({ saving, dirty, lastSaved }: { saving: "manual" | "auto" | null; dirty: boolean; lastSaved: string | null }) {
  // Re-render every 30s so "saved 1 minute ago" stays current.
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30_000)
    return () => clearInterval(t)
  }, [])

  let text = "Not saved yet"
  if (saving) text = saving === "auto" ? "Autosaving…" : "Saving…"
  else if (dirty) text = "Unsaved changes"
  else if (lastSaved) text = `Saved ${timeAgo(lastSaved)}`

  return (
    <span aria-live="polite" className={cn("text-sm", dirty && !saving ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
      {text}
    </span>
  )
}

function GooglePreview({ url, title, description }: { url: string; title: string; description: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 p-4">
      <p className="mb-2 font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Search preview</p>
      <p className="truncate text-xs text-muted-foreground">{url}</p>
      <p className="mt-0.5 line-clamp-1 text-lg leading-snug font-medium text-foreground">{title}</p>
      <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
