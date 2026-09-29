import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

// CSV download of all newsletter subscribers. Admin only (checked here, not
// just in the UI; RLS also restricts the select to admins).
export async function GET() {
  const session = await getSession()
  if (!session?.isAdmin) return new NextResponse("Forbidden", { status: 403 })

  const supabase = await createClient()
  const { data, error } = await supabase.from("newsletter_subscribers").select("email, created_at").order("created_at", { ascending: false })
  if (error) return new NextResponse(error.message, { status: 500 })

  // Quote every field; prefix formula-like values so spreadsheets don't execute them.
  const cell = (v: string) => `"${(/^[=+\-@]/.test(v) ? `'${v}` : v).replace(/"/g, '""')}"`
  const csv = ["email,subscribed_at", ...(data ?? []).map((r) => `${cell(r.email)},${cell(r.created_at)}`)].join("\r\n")
  const date = new Date().toISOString().slice(0, 10)

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}
