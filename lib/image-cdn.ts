/**
 * Origin of the optional image CDN domain from NEXT_PUBLIC_IMAGE_CDN_URL,
 * e.g. "https://cdn.mainstreamtech.co.uk". Tolerates stray spaces,
 * trailing commas/slashes and paths; returns null (images stay on the site's
 * own domain) if the value isn't a usable http(s) URL, so a typo in the
 * setting can never break every image.
 */
export function imageCdnOrigin(raw: string | undefined = process.env.NEXT_PUBLIC_IMAGE_CDN_URL): string | null {
  const value = raw?.trim().replace(/[\s,;/]+$/, "")
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null
  } catch {
    return null
  }
}
