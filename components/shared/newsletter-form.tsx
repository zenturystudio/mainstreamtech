"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { subscribeToNewsletter } from "@/lib/actions/public"
import { newsletterSchema, type NewsletterInput } from "@/lib/validations/public"
import { cn } from "@/lib/utils"

export function NewsletterForm({ className, id = "newsletter" }: { className?: string; id?: string }) {
  const form = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: { email: "", website: "" },
  })
  const error = form.formState.errors.email?.message

  async function onSubmit(values: NewsletterInput) {
    const result = await subscribeToNewsletter(values)
    if (result.success) {
      toast.success("You're subscribed! Watch your inbox for the next issue.")
      form.reset()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className={cn("w-full", className)} noValidate>
      <div className="flex gap-2">
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <Input
          id={`${id}-email`}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-10 bg-background"
          {...form.register("email")}
        />
        {/* Honeypot */}
        <input type="text" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" {...form.register("website")} />
        <Button type="submit" className="h-10 shrink-0 px-4" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Loader2 className="animate-spin" /> : <ArrowRight />}
          <span className="sr-only sm:not-sr-only">Subscribe</span>
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
