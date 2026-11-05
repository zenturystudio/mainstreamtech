import { getRecentNewsPosts } from "@/lib/queries/public"
import { siteConfig } from "@/lib/site"
import { absoluteUrl } from "@/lib/utils"
import { postPath } from "@/lib/urls"

// Google News sitemap: only stories from the last 48 hours (Google's rule), so it
// is refreshed often. Listed in robots.txt next to the main sitemap.
export const revalidate = 600

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")

export async function GET() {
  const posts = await getRecentNewsPosts()
  const entries = posts
    .map(
      (p) => `  <url>
    <loc>${absoluteUrl(postPath(p.slug))}</loc>
    <news:news>
      <news:publication>
        <news:name>${xml(siteConfig.name)}</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(p.published_at).toISOString()}</news:publication_date>
      <news:title>${xml(p.title)}</news:title>
    </news:news>
  </url>`,
    )
    .join("\n")

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries}
</urlset>
`
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } })
}
