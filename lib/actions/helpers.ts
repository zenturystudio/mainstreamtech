import "server-only"
import { revalidatePath } from "next/cache"
import type { ZodError } from "zod"

/** Public pages are ISR-cached; bust everything after a content change. */
export function revalidateSite() {
  revalidatePath("/", "layout")
}

export const firstIssue = (error: ZodError) => error.issues[0]?.message ?? "Invalid input"

/** Turns Postgres/PostgREST errors into messages an editor can act on. */
export function dbError(error: { code?: string; message: string } | null, what = "item"): string {
  if (!error) return "Something went wrong"
  switch (error.code) {
    case "23505":
      return `That ${what} already exists. Try a different name or slug.`
    case "23503":
      return `This ${what} is still in use.`
    case "42501":
      return "You don't have permission to do that."
    case "PGRST116":
      return `That ${what} no longer exists.`
    default:
      return error.message
  }
}
