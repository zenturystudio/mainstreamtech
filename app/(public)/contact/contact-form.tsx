"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { CheckCircle2, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { sendContactMessage } from "@/lib/actions/public"
import { contactSchema, type ContactInput } from "@/lib/validations/public"

export function ContactForm() {
  const [sent, setSent] = useState(false)
  const form = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "", website: "" },
  })
  const { errors, isSubmitting } = form.formState

  async function onSubmit(values: ContactInput) {
    const result = await sendContactMessage(values)
    if (result.success) {
      setSent(true)
      form.reset()
    } else {
      toast.error(result.error)
    }
  }

  if (sent) {
    return (
      <div role="status" className="flex flex-col items-center rounded-2xl border p-10 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
          <CheckCircle2 className="size-7" aria-hidden />
        </span>
        <h2 className="mt-5 text-xl font-semibold">Message sent</h2>
        <p className="mt-2 max-w-sm text-muted-foreground">Thanks for reaching out. We usually reply within two working days.</p>
        <Button variant="outline" className="mt-6" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    )
  }

  const field = (name: keyof ContactInput, label: string, input: React.ReactNode) => (
    <div className="flex flex-col gap-2">
      <Label htmlFor={`contact-${name}`}>{label}</Label>
      {input}
      {errors[name] && (
        <p id={`contact-${name}-error`} className="text-sm text-destructive">
          {errors[name]?.message}
        </p>
      )}
    </div>
  )
  const a11y = (name: keyof ContactInput) => ({
    id: `contact-${name}`,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `contact-${name}-error` : undefined,
  })

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5 rounded-2xl border p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        {field("name", "Name", <Input autoComplete="name" className="h-10" {...a11y("name")} {...form.register("name")} />)}
        {field("email", "Email", <Input type="email" autoComplete="email" className="h-10" {...a11y("email")} {...form.register("email")} />)}
      </div>
      {field("subject", "Subject", <Input className="h-10" {...a11y("subject")} {...form.register("subject")} />)}
      {field("message", "Message", <Textarea rows={6} {...a11y("message")} {...form.register("message")} />)}
      {/* Honeypot */}
      <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" {...form.register("website")} />
      <Button type="submit" size="lg" className="h-11 self-start px-6" disabled={isSubmitting}>
        {isSubmitting ? <Loader2 className="animate-spin" /> : <Send />}
        Send message
      </Button>
    </form>
  )
}
