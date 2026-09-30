"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"

/**
 * Counts one view per post per browser session. Runs client-side so cached
 * (ISR) pages still register views.
 */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    const key = `viewed:${slug}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
    } catch {
      // Storage blocked: still count, at worst once per page load.
    }
    // Supabase queries are lazy: the request is only sent once awaited/then'd.
    const count = async () => {
      const { error } = await createClient().rpc("increment_post_views", { post_slug: slug })
      if (error) console.warn("[views] counting failed:", error.message)
    }
    void count()
  }, [slug])

  return null
}
