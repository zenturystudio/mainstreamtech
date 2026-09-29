"use server"

import { guardAdmin, guardUser } from "@/lib/auth"
import { dbError, firstIssue, revalidateSite } from "@/lib/actions/helpers"
import { createClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/utils"
import { categorySchema, tagSchema } from "@/lib/validations/cms"
import type { ActionResult } from "@/types/app"

// ---- Categories (admin only) -------------------------------------------------

export async function saveCategory(id: string | null, input: unknown): Promise<ActionResult> {
  const guard = await guardAdmin()
  if (!guard.ok) return { success: false, error: guard.error }
  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { error } = id
    ? await supabase.from("categories").update(parsed.data).eq("id", id)
    : await supabase.from("categories").insert(parsed.data)
  if (error) return { success: false, error: dbError(error, "category") }

  revalidateSite()
  return { success: true }
}

/** Deletes a category. Posts using it are first moved to `reassignTo` (or left uncategorised). */
export async function deleteCategory(id: string, reassignTo: string | null): Promise<ActionResult> {
  const guard = await guardAdmin()
  if (!guard.ok) return { success: false, error: guard.error }
  if (reassignTo === id) return { success: false, error: "Pick a different category to move posts to." }

  const supabase = await createClient()
  const { error: moveError } = await supabase.from("posts").update({ category_id: reassignTo }).eq("category_id", id)
  if (moveError) return { success: false, error: dbError(moveError, "category") }

  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) return { success: false, error: dbError(error, "category") }

  revalidateSite()
  return { success: true }
}

// ---- Tags ------------------------------------------------------------------

export async function saveTag(id: string | null, input: unknown): Promise<ActionResult> {
  const guard = await guardAdmin()
  if (!guard.ok) return { success: false, error: guard.error }
  const parsed = tagSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { error } = id ? await supabase.from("tags").update(parsed.data).eq("id", id) : await supabase.from("tags").insert(parsed.data)
  if (error) return { success: false, error: dbError(error, "tag") }

  revalidateSite()
  return { success: true }
}

export async function deleteTag(id: string): Promise<ActionResult> {
  const guard = await guardAdmin()
  if (!guard.ok) return { success: false, error: guard.error }

  const supabase = await createClient()
  const { error } = await supabase.from("tags").delete().eq("id", id)
  if (error) return { success: false, error: dbError(error, "tag") }

  revalidateSite()
  return { success: true }
}

/** Create-on-the-fly from the post editor. Any team member may add tags; reuses an existing tag with the same slug. */
export async function createTagQuick(name: string): Promise<{ success: true; tag: { id: string; name: string; slug: string } } | { success: false; error: string }> {
  const guard = await guardUser()
  if (!guard.ok) return { success: false, error: guard.error }
  const parsed = tagSchema.safeParse({ name, slug: slugify(name) })
  if (!parsed.success) return { success: false, error: firstIssue(parsed.error) }

  const supabase = await createClient()
  const { data: existing } = await supabase.from("tags").select("id, name, slug").eq("slug", parsed.data.slug).maybeSingle()
  if (existing) return { success: true, tag: existing }

  const { data, error } = await supabase.from("tags").insert(parsed.data).select("id, name, slug").single()
  if (error) return { success: false, error: dbError(error, "tag") }
  return { success: true, tag: data }
}
