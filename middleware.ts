import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

// Leftovers from the old WordPress site (and bot probes Google picked up):
// 410 Gone tells search engines to drop them, instead of a 200 "not found" page.
const GONE = /^\/(?:wp-(?:admin|content|includes|json)|wp-[^/]*\.php|index\.php|xmlrpc\.php|[&$*])(?:\/|$)/

export async function middleware(request: NextRequest) {
  if (GONE.test(request.nextUrl.pathname)) {
    return new NextResponse("Gone", { status: 410, headers: { "X-Robots-Tag": "noindex" } })
  }
  return updateSession(request)
}

export const config = {
  matcher: [
    // Everything except static assets and image optimisation files.
    "/((?!_next/static|_next/image|favicon.ico|rss.xml|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)",
    // Old WordPress uploads are images, which the pattern above skips.
    "/wp-content/:path*",
  ],
}
