import type { NextConfig } from "next"

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co"

const nextConfig: NextConfig = {
  // Lets the admin dev server (npm run dev:admin) build into its own folder
  // so it can run alongside the public dev server.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  // jsdom (used by isomorphic-dompurify) must not be bundled.
  serverExternalPackages: ["isomorphic-dompurify", "jsdom"],
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
}

export default nextConfig
