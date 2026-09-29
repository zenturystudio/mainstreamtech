import "server-only"
import DOMPurify from "isomorphic-dompurify"
import { common, createLowlight } from "lowlight"
import { toHtml } from "hast-util-to-html"
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
 * 3. syntax-highlights code blocks.
 * Steps 2–3 run on already-sanitized HTML and only emit escaped output.
 */
export function prepareContent(html: string): { html: string; headings: Heading[] } {
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } })

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

  return { html: highlighted, headings }
}
