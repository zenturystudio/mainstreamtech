import type { MetadataRoute } from "next"
import { STAFF_USERNAME, getAllPostSlugs, getAuthors, getCategories, getTags } from "@/lib/queries/public"
import { absoluteUrl } from "@/lib/utils"
import { postPath } from "@/lib/urls"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags, authors] = await Promise.all([getAllPostSlugs(), getCategories(), getTags(), getAuthors()])
  // Newest edit to any live story, so the home and Latest pages change when a story does.
  const latest = posts.reduce((max, p) => Math.max(max, Date.parse(p.updated_at) || 0), 0)
  const latestDate = latest ? new Date(latest) : new Date()

  return [
    { url: absoluteUrl("/"), lastModified: latestDate, changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/blog"), lastModified: latestDate, changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.3 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.2 },
    ...posts.map((p) => ({
      url: absoluteUrl(postPath(p.slug)),
      // Edits count as changes (updated_at is never earlier than publishing).
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      // Image sitemap entry: helps the cover show in Google Images and Discover.
      ...(p.cover_image_url ? { images: [p.cover_image_url] } : {}),
    })),
    ...categories.filter((c) => c.postCount > 0).map((c) => ({ url: absoluteUrl(`/category/${c.slug}`), changeFrequency: "daily" as const, priority: 0.6 })),
    // Tags used by a single story are thin pages that only repeat that story.
    ...tags.filter((t) => t.postCount > 1).map((t) => ({ url: absoluteUrl(`/tag/${t.slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
    // getAuthors only returns people with published stories.
    ...authors.filter((a) => a.username).map((a) => ({ url: absoluteUrl(`/author/${a.username}`), changeFrequency: "weekly" as const, priority: 0.4 })),
    { url: absoluteUrl(`/author/${STAFF_USERNAME}`), changeFrequency: "weekly" as const, priority: 0.4 },
  ]
}
