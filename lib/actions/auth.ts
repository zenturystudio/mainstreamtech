"use server"

import { redirect } from "next/navigation"
import { guardUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { adminOrigin, safeNextPath } from "@/lib/urls"
import { loginSchema, magicLinkSchema, passwordSchema } from "@/lib/validations/auth"
import type { ActionResult } from "@/types/app"

export async function signIn(input: unknown, next?: string): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  // Same message for unknown email and wrong password.
  if (error) return { success: false, error: error.status === 400 ? "Incorrect email or password." : error.message }

  redirect(safeNextPath(next))
}

export async function sendMagicLink(input: unknown, next?: string): Promise<ActionResult> {
  const parsed = magicLinkSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    // Only existing team members can sign in; no self sign-up.
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${adminOrigin()}/auth/confirm?next=${encodeURIComponent(safeNextPath(next))}`,
    },
  })
  // Don't reveal whether the address has an account.
  if (error && error.code !== "otp_disabled" && error.status !== 400 && error.status !== 422) {
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function changePassword(input: unknown): Promise<ActionResult> {
  const guard = await guardUser()
  if (!guard.ok) return { success: false, error: guard.error }
  const parsed = passwordSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return { success: false, error: error.message }
  return { success: true }
}
