import { getPosts, getSiteSettings } from "@/lib/queries/public"
import { absoluteUrl } from "@/lib/utils"

export const revalidate = 900

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")

export async function GET() {
  const [settings, { items }] = await Promise.all([getSiteSettings(), getPosts({ perPage: 30 })])

  const entries = items
    .map((p) => {
      const url = absoluteUrl(`/blog/${p.slug}`)
      return `    <item>
      <title>${xml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${p.published_at ? `<pubDate>${new Date(p.published_at).toUTCString()}</pubDate>` : ""}
      ${p.excerpt ? `<description>${xml(p.excerpt)}</description>` : ""}
      ${p.author.full_name ? `<dc:creator>${xml(p.author.full_name)}</dc:creator>` : ""}
      ${p.category ? `<category>${xml(p.category.name)}</category>` : ""}
      ${p.cover_image_url ? `<enclosure url="${xml(p.cover_image_url)}" type="image/jpeg" length="0" />` : ""}
    </item>`
    })
    .join("\n")

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xml(settings.site_name)}</title>
    <link>${absoluteUrl("/")}</link>
    <description>${xml(settings.site_description ?? "")}</description>
    <language>en-gb</language>
    <atom:link href="${absoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml" />
    ${items[0]?.published_at ? `<lastBuildDate>${new Date(items[0].published_at).toUTCString()}</lastBuildDate>` : ""}
${entries}
  </channel>
</rss>`

  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } })
}
