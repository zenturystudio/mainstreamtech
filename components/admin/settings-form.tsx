"use client"

import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"
import { ImageUpload } from "@/components/admin/image-upload"
import { Panel } from "@/components/admin/page-heading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { saveSettings } from "@/lib/actions/admin"
import { settingsSchema, type SettingsInput } from "@/lib/validations/cms"

const SOCIALS = [
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/mainstreamtech" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/…" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/company/…" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@…" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/…" },
] as const

export function SettingsForm({ defaults }: { defaults: SettingsInput }) {
  const router = useRouter()
  const form = useForm<SettingsInput>({ resolver: zodResolver(settingsSchema), defaultValues: defaults })
  const { errors, isSubmitting, isDirty } = form.formState

  async function onSubmit(values: SettingsInput) {
    const result = await saveSettings(values)
    if (!result.success) return toast.error(result.error)
    toast.success("Settings saved")
    form.reset(values)
    router.refresh()
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <Panel title="General">
        <div className="grid gap-5 p-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="site-name">Site name</Label>
            <Input id="site-name" aria-invalid={Boolean(errors.site_name)} {...form.register("site_name")} />
            {errors.site_name && <p className="text-sm text-destructive">{errors.site_name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ppp">Posts per page</Label>
            <Input id="ppp" type="number" min={1} max={50} className="w-28" aria-invalid={Boolean(errors.posts_per_page)} {...form.register("posts_per_page")} />
            {errors.posts_per_page ? <p className="text-sm text-destructive">Between 1 and 50</p> : <p className="text-xs text-muted-foreground">Used on the homepage and listing pages.</p>}
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="site-description">Description</Label>
            <Textarea id="site-description" rows={3} {...form.register("site_description")} />
            <p className="text-xs text-muted-foreground">Used as the default meta description.</p>
          </div>
        </div>
      </Panel>

      <Panel title="Logo">
        <div className="p-5">
          <Controller control={form.control} name="logo_url" render={({ field }) => <ImageUpload value={field.value ?? null} onChange={field.onChange} aspect="aspect-[4/1]" label="Upload logo" className="max-w-md" />} />
          <p className="mt-3 text-xs text-muted-foreground">Leave empty to use the built-in Mainstream Tech wordmark.</p>
        </div>
      </Panel>

      <Panel title="Social links">
        <div className="grid gap-5 p-5 md:grid-cols-2">
          {SOCIALS.map((s) => (
            <div key={s.key} className="flex flex-col gap-2">
              <Label htmlFor={`social-${s.key}`}>{s.label}</Label>
              <Input id={`social-${s.key}`} type="url" placeholder={s.placeholder} aria-invalid={Boolean(errors.social_links?.[s.key])} {...form.register(`social_links.${s.key}`)} />
              {errors.social_links?.[s.key] && <p className="text-sm text-destructive">Enter a full URL starting with https://</p>}
            </div>
          ))}
        </div>
      </Panel>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" disabled={isSubmitting || !isDirty} className="h-10 px-5 shadow-lg">
          {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
          Save settings
        </Button>
      </div>
    </form>
  )
}
