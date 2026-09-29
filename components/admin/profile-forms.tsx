"use client"

import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { KeyRound, Loader2, Save } from "lucide-react"
import { ImageUpload } from "@/components/admin/image-upload"
import { Panel } from "@/components/admin/page-heading"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { saveProfile } from "@/lib/actions/admin"
import { changePassword } from "@/lib/actions/auth"
import { passwordSchema, type PasswordInput } from "@/lib/validations/auth"
import { profileSchema, type ProfileInput } from "@/lib/validations/cms"

export function ProfileForm({ defaults, email }: { defaults: ProfileInput; email: string }) {
  const router = useRouter()
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: defaults })
  const { errors, isSubmitting, isDirty } = form.formState

  async function onSubmit(values: ProfileInput) {
    const result = await saveProfile(values)
    if (!result.success) return toast.error(result.error)
    toast.success("Profile saved")
    form.reset(values)
    router.refresh()
  }

  return (
    <Panel title="Public profile">
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5 p-5">
        <div className="flex flex-col gap-2">
          <Label>Photo</Label>
          <Controller control={form.control} name="avatar_url" render={({ field }) => <ImageUpload value={field.value ?? null} onChange={field.onChange} round label="Upload photo" />} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input id="full-name" autoComplete="name" aria-invalid={Boolean(errors.full_name)} {...form.register("full_name")} />
            {errors.full_name && <p className="text-sm text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" autoComplete="username" className="font-mono" aria-invalid={Boolean(errors.username)} {...form.register("username")} />
            {errors.username ? <p className="text-sm text-destructive">{errors.username.message}</p> : <p className="text-xs text-muted-foreground">Your author page: /author/{form.watch("username")}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={email} disabled readOnly />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" rows={4} maxLength={500} {...form.register("bio")} />
          <p className="text-xs text-muted-foreground">Shown under your stories and on your author page.</p>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting || !isDirty}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
            Save profile
          </Button>
        </div>
      </form>
    </Panel>
  )
}

export function PasswordForm({ highlight }: { highlight?: boolean }) {
  const form = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema), defaultValues: { password: "", confirm: "" } })
  const { errors, isSubmitting } = form.formState

  async function onSubmit(values: PasswordInput) {
    const result = await changePassword(values)
    if (!result.success) return toast.error(result.error)
    toast.success("Password updated")
    form.reset()
  }

  return (
    <Panel title={highlight ? "Set your password" : "Change password"} className={highlight ? "ring-3 ring-brand/40" : undefined}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5 p-5">
        {highlight && <p className="text-sm text-muted-foreground">Welcome! Choose a password so you can sign in with your email next time.</p>}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.password)} {...form.register("password")} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="confirm-password">Confirm password</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" aria-invalid={Boolean(errors.confirm)} {...form.register("confirm")} />
            {errors.confirm && <p className="text-sm text-destructive">{errors.confirm.message}</p>}
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" /> : <KeyRound />}
            {highlight ? "Set password" : "Update password"}
          </Button>
        </div>
      </form>
    </Panel>
  )
}
