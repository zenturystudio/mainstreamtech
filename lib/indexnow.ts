import "server-only"
import { siteConfig } from "@/lib/site"

// IndexNow tells Bing (and Yandex, Naver, Seznam) about new or updated URLs right
// away instead of waiting for a crawl. The key is public by design: it must be
// served at /<key>.txt (public/e176c2862351fe4e959523637b26bd2c.txt) to prove we own the site.
const KEY = "e176c2862351fe4e959523637b26bd2c"

/** Fire-and-forget ping for live URLs; does nothing off the production domain. */
export async function pingIndexNow(urls: string[]): Promise<void> {
  const origin = siteConfig.url.replace(/\/$/, "")
  if (!urls.length || !origin.startsWith("https://") || origin.includes("vercel.app")) return
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: new URL(origin).host, key: KEY, keyLocation: `${origin}/${KEY}.txt`, urlList: urls }),
      signal: AbortSignal.timeout(5000),
    })
  } catch {
    // A failed ping only means slower discovery; never block publishing on it.
  }
}
