import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database.types"

export type Profile = Tables<"profiles">
export type Session = { user: User; profile: Profile; isAdmin: boolean }

/** Current user + profile, deduplicated per request. Verifies the JWT with Supabase. */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (!profile) return null
  return { user, profile, isAdmin: profile.role === "admin" }
})

/** For pages: redirects to /login when signed out. */
export async function requireUser(): Promise<Session> {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}

/** For admin-only pages: authors are sent back to the dashboard. */
export async function requireAdmin(): Promise<Session> {
  const session = await requireUser()
  if (!session.isAdmin) redirect("/admin?denied=1")
  return session
}

type Guarded = { ok: true; session: Session } | { ok: false; error: string }

/** For server actions: returns an error instead of redirecting. */
export async function guardUser(): Promise<Guarded> {
  const session = await getSession()
  return session ? { ok: true, session } : { ok: false, error: "Your session has expired. Please sign in again." }
}

export async function guardAdmin(): Promise<Guarded> {
  const result = await guardUser()
  if (result.ok && !result.session.isAdmin) return { ok: false, error: "Only admins can do that." }
  return result
}
