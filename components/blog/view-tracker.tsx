"use client"

import { useEffect } from "react"

/**
 * Counts one view per post per browser session. Runs client-side so cached
 * (ISR) pages still register views. Uses a plain fetch to the database
 * function instead of the Supabase client, which would add ~50 KB of
 * JavaScript to every story, and waits until the browser is idle so it never
 * competes with the page loading.
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

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const apiKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !apiKey) return

    const count = () => {
      fetch(`${url}/rest/v1/rpc/increment_post_views`, {
        method: "POST",
        headers: { apikey: apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ post_slug: slug }),
        keepalive: true,
      }).catch(() => {
        // Counting is best-effort; never surface errors to readers.
      })
    }

    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500))
    const handle = idle(count)
    return () => {
      if (window.cancelIdleCallback && typeof handle === "number") window.cancelIdleCallback(handle)
    }
  }, [slug])

  return null
}
