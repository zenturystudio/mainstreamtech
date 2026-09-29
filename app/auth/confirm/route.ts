import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { safeNextPath } from "@/lib/urls"

// Landing point for magic links, invites and password-reset emails.
// Handles both the PKCE `code` flow and the `token_hash` flow.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = safeNextPath(searchParams.get("next"))

  const supabase = await createClient()
  let error: unknown = null

  if (code) {
    ;({ error } = await supabase.auth.exchangeCodeForSession(code))
  } else if (tokenHash && type) {
    ;({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }))
  } else {
    error = new Error("Missing token")
  }

  if (error) {
    return NextResponse.redirect(new URL("/login?error=link", request.url))
  }
  // Invited users have no password yet: send them to set one.
  const destination = type === "invite" || type === "recovery" ? "/admin/profile?setPassword=1" : next
  return NextResponse.redirect(new URL(destination, request.url))
}
