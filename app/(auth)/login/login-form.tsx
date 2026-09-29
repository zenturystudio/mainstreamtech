"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Loader2, MailCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendMagicLink, signIn } from "@/lib/actions/auth"
import { magicLinkSchema } from "@/lib/validations/auth"

type Mode = "password" | "magic"
const formSchema = magicLinkSchema.extend({ password: z.string() })
type FormValues = z.infer<typeof formSchema>

export function LoginForm({ next }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("password")
  const [sentTo, setSentTo] = useState<string | null>(null)
  // Email is always validated; the password is checked only in password mode.
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  })
  const { errors, isSubmitting } = form.formState

  async function onSubmit(values: FormValues) {
    if (mode === "password") {
      if (!values.password) {
        form.setError("password", { message: "Enter your password" })
        return
      }
      const result = await signIn(values, next)
      // On success the action redirects, so we only get here on failure.
      if (result && !result.success) toast.error(result.error)
      return
    }
    const result = await sendMagicLink({ email: values.email }, next)
    if (result.success) setSentTo(values.email)
    else toast.error(result.error)
  }

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-full bg-brand/10 text-brand">
          <MailCheck className="size-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-semibold">Check your inbox</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          If <span className="font-medium text-foreground">{sentTo}</span> belongs to a team member, a sign-in link is on its way.
        </p>
        <Button variant="ghost" className="mt-6" onClick={() => setSentTo(null)}>
          Use a different method
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" autoFocus className="h-10" aria-invalid={Boolean(errors.email)} {...form.register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      {mode === "password" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="h-10"
            aria-invalid={Boolean(errors.password)}
            {...form.register("password")}
          />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
      )}

      <Button type="submit" className="h-10" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="animate-spin" />}
        {mode === "password" ? "Sign in" : "Email me a sign-in link"}
      </Button>

      <button
        type="button"
        className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        onClick={() => {
          form.clearErrors()
          setMode(mode === "password" ? "magic" : "password")
        }}
      >
        {mode === "password" ? "Sign in with a magic link instead" : "Sign in with a password instead"}
      </button>
    </form>
  )
}
