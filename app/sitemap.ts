import type { MetadataRoute } from "next"
import { STAFF_USERNAME, getAllPostSlugs, getAuthors, getCategories } from "@/lib/queries/public"
import { absoluteUrl } from "@/lib/utils"
import { postPath } from "@/lib/urls"

export const revalidate = 3600

// Google ignores <changefreq> and <priority>, so only real lastmod dates are listed.
// Story dates come from updated_at, which only moves on real edits (migration
// 20261105000000); listing pages take the newest story they show.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, authors] = await Promise.all([getAllPostSlugs(), getCategories(), getAuthors()])
  const newest = (list: typeof posts) => {
    const ms = list.reduce((max, p) => Math.max(max, Date.parse(p.updated_at) || 0), 0)
    return ms ? new Date(ms) : undefined
  }
  const latestDate = newest(posts)

  return [
    { url: absoluteUrl("/"), lastModified: latestDate },
    { url: absoluteUrl("/blog"), lastModified: latestDate },
    { url: absoluteUrl("/about") },
    { url: absoluteUrl("/contact") },
    ...posts.map((p) => ({
      url: absoluteUrl(postPath(p.slug)),
      lastModified: new Date(p.updated_at),
      // Image sitemap entry: helps the cover show in Google Images and Discover.
      ...(p.cover_image_url ? { images: [p.cover_image_url] } : {}),
    })),
    ...categories
      .filter((c) => c.postCount > 0)
      .map((c) => ({ url: absoluteUrl(`/category/${c.slug}`), lastModified: newest(posts.filter((p) => p.category_id === c.id)) })),
    // getAuthors only returns people with published stories.
    ...authors.filter((a) => a.username).map((a) => ({ url: absoluteUrl(`/author/${a.username}`) })),
    { url: absoluteUrl(`/author/${STAFF_USERNAME}`), lastModified: latestDate },
  ]
}
