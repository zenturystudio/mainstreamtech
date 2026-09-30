// Helpers for routing raw <img> URLs through the Vercel image CDN
// (the same /_next/image endpoint next/image uses).

import { imageCdnOrigin } from "@/lib/image-cdn"

const SUPABASE_HOST = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null

/** Widths that exist in Next's default deviceSizes, so every URL is valid. */
export const CDN_WIDTHS = [640, 750, 828, 1080, 1200, 1920] as const

/** Only hosts listed in next.config remotePatterns can be optimised. */
export function isCdnEligible(src: string): boolean {
  try {
    const url = new URL(src)
    if (url.protocol !== "https:") return false
    if (url.hostname === "images.unsplash.com") return true
    return url.hostname === SUPABASE_HOST && url.pathname.startsWith("/storage/v1/object/public/")
  } catch {
    return false
  }
}

/** Same endpoint next/image uses: the image CDN domain when configured, else this site. */
const IMAGE_ENDPOINT = `${imageCdnOrigin() ?? ""}/_next/image`

export function cdnImageUrl(src: string, width: number, quality = 75): string {
  return `${IMAGE_ENDPOINT}?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`
}

export function cdnSrcSet(src: string): string {
  return CDN_WIDTHS.map((w) => `${cdnImageUrl(src, w)} ${w}w`).join(", ")
}
