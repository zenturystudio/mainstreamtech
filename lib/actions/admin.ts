"use server"

import { revalidatePath } from "next/cache"
import { guardAdmin, guardUser } from "@/lib/auth"
import { dbError, firstIssue, revalidateSite } from "@/lib/actions/helpers"
import { IMAGE_BUCKET } from "@/lib/storage"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { adminOrigin } from "@/lib/urls"
import { inviteSchema, profileSchema, settingsSchema } from "@/lib/validations/cms"
import type { ActionResult } from "@/types/app"

// ---- Media -------------------------------------------------------------------

/** Deletes files from storage. Storage RLS allows own files, or any file for admins. */
export async function deleteMedia(paths: string[]): Promise<ActionResult> {
  const guard = await guardUser()
  if (!guard.ok) return { success: false, error: guard.error }
  if (!paths.length) return { success: true }

  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(IMAGE_BUCKET).remove(paths)
  if (error) return { success: false, error: error.message }
  if ((data?.length ?? 0) < paths.length) return { success: false, error: "Some files couldn't be deleted. You can only delete your own uploads." }

  revalidatePath("/admin/media")
  return { success: true }
}

// ---- Subscribers (admin) -----------------------------------------------------

export async function deleteSubscribers(ids: string[]): Promise<ActionResult> {
  const guard = await guardAdmin()
  if (!guard.ok) return { success: false, error: guard.error }

  const supabase = await createClient()
  const { error } = await supabase.from("newsletter_subscribers").delete().in("id", ids)
  if (error) return { success: false, error: dbError(error, "subscriber") }

  revalidatePath("/admin/subscribers")
  return { success: true }
}

// ---- Settings (admin) --------------------------------------------------------

export async function saveSettings(input: unknown): Promise<ActionResult> {
  const guard = await guardAdmin()
  if (!guard.ok) return { success: false, error: guard.error }
  const parsed = settingsSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) }

  // Store only filled-in social links.
  const social_links = Object.fromEntries(Object.entries(parsed.data.social_links).filter(([, v]) => v))
  const supabase = await createClient()
  const { error } = await supabase
    .from("site_settings")
    .update({ ...parsed.data, social_links })
    .eq("id", 1)
  if (error) return { success: false, error: dbError(error, "setting") }

  revalidateSite()
  return { success: true }
}

// ---- Profile (self) ----------------------------------------------------------

export async function saveProfile(input: unknown): Promise<ActionResult> {
  const guard = await guardUser()
  if (!guard.ok) return { success: false, error: guard.error }
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { error } = await supabase.from("profiles").update(parsed.data).eq("id", guard.session.user.id)
  if (error) return { success: false, error: error.code === "23505" ? "That username is taken." : dbError(error, "profile") }

  revalidateSite()
  return { success: true }
}

// ---- Users (admin; uses the service role for auth admin APIs) ----------------

export async function changeUserRole(userId: string, role: "admin" | "author"): Promise<ActionResult> {
  const guard = await guardAdmin()
  if (!guard.ok) return { success: false, error: guard.error }
  if (userId === guard.session.user.id && role !== "admin") {
    return { success: false, error: "You can't remove your own admin access. Ask another admin." }
  }

  const supabase = await createClient()
  const { error } = await supabase.from("profiles").update({ role }).eq("id", userId)
  if (error) return { success: false, error: dbError(error, "user") }

  revalidatePath("/admin/users")
  return { success: true }
}

export async function inviteUser(input: unknown): Promise<ActionResult> {
  const guard = await guardAdmin()
  if (!guard.ok) return { success: false, error: guard.error }
  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) }

  const admin = createAdminClient()
  const { data, error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { full_name: parsed.data.full_name },
    redirectTo: `${adminOrigin()}/auth/confirm`,
  })
  if (error) {
    const exists = /already (been )?registered|exists/i.test(error.message)
    return { success: false, error: exists ? "Someone with that email already has an account." : error.message }
  }

  // The signup trigger created the profile as 'author'; promote if requested.
  if (parsed.data.role === "admin" && data.user) {
    await admin.from("profiles").update({ role: "admin" }).eq("id", data.user.id)
  }

  revalidatePath("/admin/users")
  return { success: true }
}

export async function removeUser(userId: string): Promise<ActionResult> {
  const guard = await guardAdmin()
  if (!guard.ok) return { success: false, error: guard.error }
  if (userId === guard.session.user.id) return { success: false, error: "You can't remove your own account." }

  // Their posts stay published and show the site byline (author_id → null).
  const { error } = await createAdminClient().auth.admin.deleteUser(userId)
  if (error) return { success: false, error: error.message }

  revalidatePath("/admin/users")
  revalidateSite()
  return { success: true }
}
