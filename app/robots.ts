import type { MetadataRoute } from "next"
import { absoluteUrl } from "@/lib/utils"

export default function robots(): MetadataRoute.Robots {
  return {
    // Robots rules are prefix matches: "/auth" would also block "/author/…" and
    // "/search" any story slug starting "search-…", so match exact paths only.
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin$", "/admin/", "/login$", "/login?", "/auth/", "/preview/", "/search$", "/search?", "/api/"],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  }
}
