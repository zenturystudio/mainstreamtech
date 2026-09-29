/** Origin serving the public site. */
export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003").replace(/\/$/, "")
}

/** Origin serving the CMS: a separate dev server locally, the same site in production. */
export function adminOrigin(): string {
  return (process.env.NEXT_PUBLIC_ADMIN_URL || siteOrigin()).replace(/\/$/, "")
}

/** Public URL for a site path, e.g. for "View site" links from the CMS. */
export function siteUrl(path = "/"): string {
  return `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`
}

/** Only allow same-origin relative redirects (prevents open redirects via ?next=). */
export function safeNextPath(next: string | null | undefined, fallback = "/admin"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback
  return next
}
