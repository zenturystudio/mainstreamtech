"use client"

import { useState, useTransition } from "react"
import { notify as toast } from "@/lib/toast"
import { ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { subscribeToNewsletter } from "@/lib/actions/public"
import { cn } from "@/lib/utils"

// Quick browser-side check only; the server action validates properly (zod).
// Kept library-free because this form is on every page.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function NewsletterForm({ className, id = "newsletter" }: { className?: string; id?: string }) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const value = email.trim()
    if (!EMAIL.test(value)) {
      setError("Enter a valid email address")
      return
    }
    setError(null)
    // Honeypot: real people never fill the hidden "website" field.
    const website = String(new FormData(e.currentTarget).get("website") ?? "")
    startTransition(async () => {
      const result = await subscribeToNewsletter({ email: value, website })
      if (result.success) {
        toast.success("You're subscribed! Watch your inbox for the next issue.")
        setEmail("")
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} className={cn("w-full", className)} noValidate>
      <div className="flex gap-2">
        <label htmlFor={`${id}-email`} className="sr-only">
          Email address
        </label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (error) setError(null)
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-10 bg-background"
        />
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
        <Button type="submit" className="h-10 shrink-0 px-4" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <ArrowRight />}
          <span className="sr-only sm:not-sr-only">Subscribe</span>
        </Button>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  )
}
