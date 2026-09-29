import type { MetadataRoute } from "next"
import { getAllPostSlugs, getCategories, getTags } from "@/lib/queries/public"
import { absoluteUrl } from "@/lib/utils"

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags] = await Promise.all([getAllPostSlugs(), getCategories(), getTags()])
  const latest = posts[0]?.published_at ? new Date(posts[0].published_at) : new Date()

  return [
    { url: absoluteUrl("/"), lastModified: latest, changeFrequency: "hourly", priority: 1 },
    { url: absoluteUrl("/blog"), lastModified: latest, changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.3 },
    { url: absoluteUrl("/contact"), changeFrequency: "yearly", priority: 0.2 },
    ...posts.map((p) => ({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: p.published_at ? new Date(p.published_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...categories.filter((c) => c.postCount > 0).map((c) => ({ url: absoluteUrl(`/category/${c.slug}`), changeFrequency: "daily" as const, priority: 0.6 })),
    ...tags.map((t) => ({ url: absoluteUrl(`/tag/${t.slug}`), changeFrequency: "weekly" as const, priority: 0.4 })),
  ]
}
