import "server-only"
import { common, createLowlight } from "lowlight"
import { toHtml } from "hast-util-to-html"
import { cdnImageUrl, cdnSrcSet, isCdnEligible } from "@/lib/cdn"
import { sanitizeStoryHtml } from "@/lib/sanitize"
import { slugify } from "@/lib/utils"

export type Heading = { id: string; text: string; level: 2 | 3 }

const lowlight = createLowlight(common)
const LANGUAGE_ALIASES: Record<string, string> = { tsx: "typescript", ts: "typescript", jsx: "javascript", js: "javascript", sh: "bash", html: "xml" }

const decode = (s: string) =>
  s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&")

/**
 * Prepares stored post HTML for rendering:
 * 1. sanitizes it (authors' HTML is untrusted),
 * 2. gives h2/h3 stable ids and collects them for the table of contents,
 * 3. syntax-highlights code blocks,
 * 4. routes images through the image CDN with responsive sizes.
 * Steps 2–4 run on already-sanitized HTML and only emit escaped output.
 */
export function prepareContent(html: string): { html: string; headings: Heading[] } {
  const clean = sanitizeStoryHtml(html)

  const headings: Heading[] = []
  const used = new Map<string, number>()

  const withIds = clean.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g, (_m, level: string, attrs: string, inner: string) => {
    const text = decode(inner.replace(/<[^>]+>/g, "")).trim()
    const base = slugify(text) || "section"
    const n = used.get(base) ?? 0
    used.set(base, n + 1)
    const id = n ? `${base}-${n}` : base
    headings.push({ id, text, level: Number(level) as 2 | 3 })
    const cleanAttrs = attrs.replace(/\sid="[^"]*"/, "")
    return `<h${level} id="${id}"${cleanAttrs}>${inner}</h${level}>`
  })

  const highlighted = withIds.replace(
    /<pre>\s*<code(?: class="language-([\w-]+)")?>([\s\S]*?)<\/code>\s*<\/pre>/g,
    (_m, lang: string | undefined, code: string) => {
      const source = decode(code)
      const language = lang ? (LANGUAGE_ALIASES[lang] ?? lang) : undefined
      const body =
        language && lowlight.registered(language)
          ? toHtml(lowlight.highlight(language, source))
          : toHtml(lowlight.highlightAuto(source))
      const label = lang ? ` data-language="${lang.replace(/[^\w-]/g, "")}"` : ""
      return `<pre${label}><code class="hljs">${body}</code></pre>`
    }
  )

  // Article column is max 720px wide.
  const withCdnImages = highlighted.replace(/<img\b([^>]*)>/g, (tag, attrs: string) => {
    const src = decode(attrs.match(/\ssrc="([^"]*)"/)?.[1] ?? "")
    if (!isCdnEligible(src)) return tag
    const rest = attrs.replace(/\s(src|srcset|sizes|loading|decoding)="[^"]*"/g, "")
    const esc = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    return `<img src="${esc(cdnImageUrl(src, 1200))}" srcset="${esc(cdnSrcSet(src))}" sizes="(min-width: 768px) 720px, 100vw" loading="lazy" decoding="async"${rest}>`
  })

  return { html: withCdnImages, headings }
}
