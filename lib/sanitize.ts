import "server-only"
import DOMPurify from "isomorphic-dompurify"

// Only YouTube embeds are allowed as iframes (stories imported from WordPress
// and the editor's YouTube button). Everything else is stripped.
const YOUTUBE_EMBED = /^https:\/\/(?:www\.)?(?:youtube-nocookie\.com|youtube\.com)\/embed\/[\w-]{6,}(?:\?[\w=&%.-]*)?$/

let hooked = false
function ensureHook() {
  if (hooked) return
  hooked = true
  DOMPurify.addHook("uponSanitizeElement", (node, data) => {
    if (data.tagName !== "iframe") return
    const src = (node as Element).getAttribute?.("src") ?? ""
    if (!YOUTUBE_EMBED.test(src)) node.parentNode?.removeChild(node)
  })
}

/** Sanitizes story HTML: normal formatting plus YouTube embeds only. */
export function sanitizeStoryHtml(html: string): string {
  ensureHook()
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["iframe"],
    ADD_ATTR: ["allow", "allowfullscreen", "frameborder", "data-youtube-video", "referrerpolicy", "loading"],
    // Inline styles from the old WordPress site (blue links, fixed font sizes)
    // would override the site theme; the editor never produces them.
    FORBID_ATTR: ["style"],
  })
}
