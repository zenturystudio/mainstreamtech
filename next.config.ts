import type { NextConfig } from "next"
import { imageCdnOrigin } from "./lib/image-cdn"

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co"

// Optional image domain (e.g. https://cdn.mainstreamtech.co.uk) pointing at
// this same Vercel project. Leave unset until that domain resolves, or every
// image breaks. Unset = images load from the site's own domain.
const imageCdn = imageCdnOrigin()

const nextConfig: NextConfig = {
  // Lets the admin dev server (npm run dev:admin) build into its own folder
  // so it can run alongside the public dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // All images go through the Vercel image CDN (next/image, plus story-body
  // images rewritten in lib/content.ts). Uploads have unique, timestamped
  // paths and never change, so optimised copies can be cached for a year.
  images: {
    ...(imageCdn ? { path: `${imageCdn}/_next/image` } : {}),
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31_536_000,
    // Show images in the browser when opened in a new tab (Next defaults to
    // "attachment", which downloads them). Safe because SVGs stay disallowed
    // (dangerouslyAllowSVG is off), so no image can carry script.
    contentDispositionType: "inline",
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // jsdom (used by isomorphic-dompurify) must not be bundled.
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  // Stories moved from /blog/{slug} to /{slug}. Permanent (308) so search
  // engines transfer ranking and old shared links keep working. /blog itself
  // (the Latest page) is untouched because the pattern needs a slug.
  async redirects() {
    return [
      { source: "/blog/:slug", destination: "/:slug", permanent: true },
      // Old WordPress addresses on this domain (old story links /slug/ already
      // work: the trailing slash is redirected away).
      { source: "/feed", destination: "/rss.xml", permanent: true },
      { source: "/feed/:rest*", destination: "/rss.xml", permanent: true },
      // Yoast sitemaps that Google already knows about.
      { source: "/:name(sitemap_index|post-sitemap|page-sitemap|category-sitemap|post_tag-sitemap|author-sitemap).xml", destination: "/sitemap.xml", permanent: true },
      // WordPress author pages, until these writers get their own profiles here.
      { source: "/author/:wp(kristen-elad|secure-login)", destination: "/author/mainstream-tech", permanent: false },
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
    // shadcn imports from the "radix-ui" barrel (even Button does, for Slot);
    // without this every page ships every Radix component.
    optimizePackageImports: ["radix-ui"],
  },
}

export default nextConfig
