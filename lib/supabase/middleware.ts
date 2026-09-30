import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { Database } from "@/types/database.types"

const ADMIN_PATHS = ["/admin", "/login", "/auth", "/preview"]
const isAdminPath = (pathname: string) => ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

/**
 * Local dev runs the CMS on its own port (NEXT_PUBLIC_ADMIN_URL, started with
 * ADMIN_MODE=1). Each server redirects the other side's routes to the right
 * origin. When NEXT_PUBLIC_ADMIN_URL is unset (production) nothing happens.
 */
function splitOriginRedirect(request: NextRequest): NextResponse | null {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!adminUrl || !siteUrl) return null

  const { pathname, search } = request.nextUrl
  if (process.env.ADMIN_MODE === "1") {
    if (pathname === "/") return NextResponse.redirect(new URL("/admin", request.url))
    if (!isAdminPath(pathname)) return NextResponse.redirect(new URL(pathname + search, siteUrl))
  } else if (isAdminPath(pathname)) {
    return NextResponse.redirect(new URL(pathname + search, adminUrl))
  }
  return null
}

/**
 * The image CDN domain (NEXT_PUBLIC_IMAGE_CDN_URL) is an alias of this site,
 * used only for /_next/image (which middleware never sees). Any page requested
 * there is permanently redirected to the main site so content isn't duplicated.
 */
function imageDomainRedirect(request: NextRequest): NextResponse | null {
  const cdn = process.env.NEXT_PUBLIC_IMAGE_CDN_URL
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!cdn || !siteUrl) return null
  // Use the Host header: request.nextUrl reports the server's own host.
  if (request.headers.get("host") !== new URL(cdn).host) return null
  const { pathname, search } = request.nextUrl
  return NextResponse.redirect(new URL(pathname + search, siteUrl), 308)
}

export async function updateSession(request: NextRequest) {
  const cdnRedirect = imageDomainRedirect(request)
  if (cdnRedirect) return cdnRedirect

  const split = splitOriginRedirect(request)
  if (split) return split

  let response = NextResponse.next({ request })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Lets the site boot before Supabase is configured; admin stays locked.
  if (!url || !anonKey) {
    if (request.nextUrl.pathname.startsWith("/admin")) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
    return response
  }

  const { pathname } = request.nextUrl
  // Public pages don't need the session; skip the auth round-trip for speed.
  if (!isAdminPath(pathname)) return response

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  // Must run right after client creation so the session token is refreshed.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && (pathname.startsWith("/admin") || pathname.startsWith("/preview"))) {
    const loginUrl = new URL("/login", request.url)
    if (pathname !== "/admin") loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (user && pathname === "/login") {
    return NextResponse.redirect(new URL("/admin", request.url))
  }

  return response
}
