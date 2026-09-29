import "server-only"
import { createClient } from "@/lib/supabase/server"

/** Lightweight option lists for editor selects. */
export async function getTaxonomyOptions() {
  const supabase = await createClient()
  const [categories, tags] = await Promise.all([
    supabase.from("categories").select("id, name, slug").order("name"),
    supabase.from("tags").select("id, name, slug").order("name"),
  ])
  return { categories: categories.data ?? [], tags: tags.data ?? [] }
}
