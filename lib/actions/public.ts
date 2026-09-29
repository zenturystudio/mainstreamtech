"use server"

import { createPublicClient } from "@/lib/supabase/server"
import { contactSchema, newsletterSchema } from "@/lib/validations/public"
import type { ActionResult } from "@/types/app"

const firstIssue = (error: { issues: { message: string }[] }) => error.issues[0]?.message ?? "Invalid input"

export async function subscribeToNewsletter(input: unknown): Promise<ActionResult> {
  const parsed = newsletterSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) }
  // Honeypot tripped: pretend success so bots learn nothing.
  if (parsed.data.website) return { success: true }

  // Anon insert is allowed by RLS; reading the list back is not.
  const { error } = await createPublicClient().from("newsletter_subscribers").insert({ email: parsed.data.email })
  // Already subscribed counts as success (and doesn't reveal who is on the list).
  if (error && error.code !== "23505") return { success: false, error: "Couldn't subscribe right now. Please try again." }
  return { success: true }
}

// Contact messages have no table yet; they need an email provider (e.g. Resend)
// to be delivered. Validation and spam protection are in place.
export async function sendContactMessage(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) }
  if (parsed.data.website) return { success: true }
  return { success: true }
}
