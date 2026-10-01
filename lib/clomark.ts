import "server-only"
import { createHash, timingSafeEqual } from "node:crypto"
import { lookup } from "node:dns/promises"
import { isIP } from "node:net"
import DOMPurify from "isomorphic-dompurify"
import { NextResponse } from "next/server"
import { IMAGE_BUCKET } from "@/lib/storage"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Shared pieces of the Clomark receiver (app/api/content). Clomark is an
 * external content engine; everything it sends is untrusted.
 */

export const MAX_JSON_BYTES = 500 * 1024
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024
/** Storage folder for Clomark images; shows in Admin → Media → Blog media. */
const STORAGE_DIR = "clomark/blog"

export const apiError = (status: number, error: string, headers?: HeadersInit) =>
  NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store", ...headers } })

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest()

/**
 * Checks the x-api-key header against CLOMARK_API_KEY in constant time
 * (both sides are hashed first, so lengths always match). Fails closed when
 * the env var is missing.
 */
export function checkApiKey(request: Request): "ok" | "unauthorized" | "not-configured" {
  const expected = process.env.CLOMARK_API_KEY?.trim()
  if (!expected) return "not-configured"
  const given = request.headers.get("x-api-key")?.trim() ?? ""
  if (!given) return "unauthorized"
  return timingSafeEqual(sha256(given), sha256(expected)) ? "ok" : "unauthorized"
}

/** Auth result as an error response, or null when the key is valid. */
export function authError(request: Request): NextResponse | null {
  const result = checkApiKey(request)
  if (result === "ok") return null
  if (result === "not-configured") {
    console.error("[clomark] CLOMARK_API_KEY is not set; rejecting request")
    return apiError(503, "Receiver is not configured")
  }
  return apiError(401, "Invalid or missing API key")
}

// ---------------------------------------------------------------------------
// Rate limiting (Postgres-backed, so it holds across serverless instances)
// ---------------------------------------------------------------------------

export const RATE_LIMITS = {
  content: { limit: 60, windowSeconds: 60 },
  images: { limit: 120, windowSeconds: 60 },
} as const

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || request.headers.get("x-real-ip") || "unknown"
}

/** 429 response when over the limit, otherwise null. Counts every request, including bad keys. */
export async function rateLimit(request: Request, name: keyof typeof RATE_LIMITS): Promise<NextResponse | null> {
  const { limit, windowSeconds } = RATE_LIMITS[name]
  const { data, error } = await createAdminClient().rpc("api_rate_limit_hit", {
    p_bucket: `clomark:${name}:${clientIp(request)}`,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })
  if (error) {
    // Don't take publishing down if the limiter itself fails; the API key still applies.
    console.error("[clomark] rate limiter unavailable:", error.message)
    return null
  }
  return data === false ? apiError(429, "Too many requests. Try again in a minute.", { "Retry-After": String(windowSeconds) }) : null
}

// ---------------------------------------------------------------------------
// HTML
// ---------------------------------------------------------------------------

const ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr",
  "strong", "b", "em", "i", "u", "s", "sub", "sup",
  "a", "ul", "ol", "li",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
  "img", "figure", "figcaption", "blockquote", "code", "pre",
]
const ALLOWED_ATTR = ["href", "title", "src", "alt", "width", "height", "colspan", "rowspan", "start", "class"]

// Runs only during purify(): DOMPurify is a shared instance, and the story
// sanitiser (lib/sanitize.ts) must not inherit these rules.
function clomarkAttributes(node: Element) {
  if (!("tagName" in node)) return
  // class only survives as a code-block language (language-js etc.).
  const cls = node.getAttribute("class")
  if (cls !== null && !(node.tagName === "CODE" && /^language-[\w-]+$/.test(cls))) node.removeAttribute("class")
  if (node.tagName === "A") {
    const href = node.getAttribute("href") ?? ""
    if (!/^(https?:|mailto:|\/|#)/i.test(href)) node.removeAttribute("href")
    else if (/^https?:/i.test(href)) node.setAttribute("rel", "noopener noreferrer")
  }
  if (node.tagName === "IMG" && !/^https?:\/\//i.test(node.getAttribute("src") ?? "")) node.remove()
}

/** Allow-list sanitiser for Clomark HTML: no scripts, iframes, styles or event handlers. */
function purify(html: string): string {
  DOMPurify.addHook("afterSanitizeAttributes", clomarkAttributes)
  try {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR: [...ALLOWED_ATTR, "rel"],
      ALLOW_DATA_ATTR: false,
      // Drop the contents of these entirely instead of unwrapping them.
      FORBID_CONTENTS: ["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math", "form"],
    })
  } finally {
    DOMPurify.removeHook("afterSanitizeAttributes", clomarkAttributes)
  }
}

const textOf = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()

/**
 * Sanitises Clomark's HTML and fits it to the CMS editor (Tiptap: h2–h4,
 * stored as HTML, so the post stays editable in the admin):
 * - a leading <h1> repeating the title is dropped (the page renders the title),
 * - other h1 → h2, h5/h6 → h4,
 * - when FAQs are sent separately, an "FAQ" section in the body is removed so
 *   it isn't shown twice (the site renders the FAQ list itself).
 */
export function prepareClomarkHtml(html: string, opts: { title: string; hasFaqs: boolean }): string {
  let out = purify(html).trim()

  const lead = out.match(/^<h1>([\s\S]*?)<\/h1>/)
  if (lead && textOf(lead[1]).toLowerCase() === opts.title.trim().toLowerCase()) out = out.slice(lead[0].length).trim()

  out = out
    .replace(/<(\/?)h1>/g, "<$1h2>")
    .replace(/<(\/?)h[56]>/g, "<$1h4>")

  if (opts.hasFaqs) {
    const heading = /<h([234])>((?:(?!<\/h[234]>)[\s\S])*?)<\/h\1>/g
    for (let m; (m = heading.exec(out)); ) {
      if (!/^(?:faqs?|frequently asked questions)\b/i.test(textOf(m[2]))) continue
      // Remove up to the next heading of the same or a higher level (or the end).
      const level = Number(m[1])
      const rest = out.slice(m.index + m[0].length)
      const next = rest.search(new RegExp(`<h[2-${level}]>`))
      out = out.slice(0, m.index) + (next >= 0 ? rest.slice(next) : "")
      break
    }
  }
  return out.replace(/<p>\s*<\/p>/g, "").trim()
}

/** FAQ answers/questions are plain text in the CMS. */
export const plainText = textOf

// ---------------------------------------------------------------------------
// Images
// ---------------------------------------------------------------------------

type ImageKind = { mime: "image/jpeg" | "image/png" | "image/webp"; ext: "jpg" | "png" | "webp" }

/** Detects JPG/PNG/WebP from the file's first bytes (never trusts the declared type). */
export function sniffImage(bytes: Uint8Array): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" }
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return { mime: "image/png", ext: "png" }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.subarray(8, 12)) === "WEBP"
  )
    return { mime: "image/webp", ext: "webp" }
  return null
}

/** Uploads image bytes to our storage and returns the public URL. */
export async function storeImage(bytes: Uint8Array, kind: ImageKind, nameHint: string): Promise<string> {
  const base =
    nameHint
      .replace(/\.[a-z0-9]{2,5}$/i, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "image"
  const path = `${STORAGE_DIR}/${Date.now()}-${base}.${kind.ext}`
  const bucket = createAdminClient().storage.from(IMAGE_BUCKET)
  const { error } = await bucket.upload(path, bytes, { contentType: kind.mime, cacheControl: "31536000", upsert: false })
  if (error) throw new Error(`Storage upload failed: ${error.message}`)
  return bucket.getPublicUrl(path).data.publicUrl
}

/** True for URLs that already point at our own image bucket. */
export function isOwnImage(url: string): boolean {
  const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !!supabase && url.startsWith(`${supabase.replace(/\/$/, "")}/storage/v1/object/public/${IMAGE_BUCKET}/`)
}

function isPrivateAddress(ip: string): boolean {
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip
  if (isIP(v4) === 4) {
    const [a, b] = v4.split(".").map(Number)
    return (
      a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19))
    )
  }
  const v6 = ip.toLowerCase()
  return v6 === "::" || v6 === "::1" || v6.startsWith("fc") || v6.startsWith("fd") || v6.startsWith("fe80") || v6.startsWith("ff")
}

/** Refuses URLs that resolve to private/internal networks (SSRF guard). */
async function assertPublicUrl(raw: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    throw new Error("is not a valid URL")
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("must be an http(s) URL")
  if (url.username || url.password) throw new Error("must not contain credentials")
  if (url.port && url.port !== "80" && url.port !== "443") throw new Error("must use the default port")
  const host = url.hostname.replace(/^\[|\]$/g, "")
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => [])
  if (!addresses.length) throw new Error("host could not be resolved")
  if (addresses.some((a) => isPrivateAddress(a.address))) throw new Error("points to a private network")
  return url
}

/**
 * Downloads a remote image (max 10 MB, JPG/PNG/WebP, 15 s, ≤3 redirects) and
 * re-hosts it on our storage, so posts never hot-link. Images already in our
 * bucket are returned as-is.
 */
export async function rehostImage(raw: string): Promise<string> {
  if (isOwnImage(raw)) return raw
  let url = await assertPublicUrl(raw)
  let response: Response | null = null
  for (let hop = 0; hop <= 3; hop++) {
    response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15_000), headers: { Accept: "image/*" } })
    if (response.status >= 300 && response.status < 400 && response.headers.get("location")) {
      if (hop === 3) throw new Error("redirected too many times")
      url = await assertPublicUrl(new URL(response.headers.get("location")!, url).toString())
      continue
    }
    break
  }
  if (!response || !response.ok || !response.body) throw new Error(`could not be downloaded (HTTP ${response?.status ?? "error"})`)
  if (Number(response.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES) throw new Error("is larger than 10 MB")

  // Stream with a hard cap (content-length can lie or be missing).
  const chunks: Uint8Array[] = []
  let size = 0
  const reader = response.body.getReader()
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_IMAGE_BYTES) {
      await reader.cancel()
      throw new Error("is larger than 10 MB")
    }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const c of chunks) {
    bytes.set(c, offset)
    offset += c.byteLength
  }
  const kind = sniffImage(bytes)
  if (!kind) throw new Error("is not a JPG, PNG or WebP image")
  return storeImage(bytes, kind, decodeURIComponent(url.pathname.split("/").pop() ?? "image"))
}
