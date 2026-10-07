import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/utils"

export default function robots(): MetadataRoute.Robots {
  return {
    // Robots rules are prefix matches: "/auth" would also block "/author/…", so
    // match exact paths only. /search is left crawlable so Google sees its noindex.
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin$", "/admin/", "/login$", "/login?", "/auth/", "/preview/", "/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
