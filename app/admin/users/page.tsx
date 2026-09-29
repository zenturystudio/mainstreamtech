import type { Metadata } from "next"
import { PageHeading } from "@/components/admin/page-heading"
import { UsersManager, type TeamMember } from "@/components/admin/users-manager"
import { requireAdmin } from "@/lib/auth"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata: Metadata = { title: "Users" }

export default async function UsersPage() {
  const session = await requireAdmin()
  // Emails and sign-in times live in auth.users, which needs the service role.
  const admin = createAdminClient()
  const [{ data: auth }, { data: profiles }, { data: posts }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("profiles").select("id, full_name, username, avatar_url, role"),
    admin.from("posts").select("author_id"),
  ])

  const counts = new Map<string, number>()
  for (const p of posts ?? []) if (p.author_id) counts.set(p.author_id, (counts.get(p.author_id) ?? 0) + 1)

  const users: TeamMember[] = (auth?.users ?? [])
    .map((u) => {
      const profile = profiles?.find((p) => p.id === u.id)
      return {
        id: u.id,
        name: profile?.full_name || profile?.username || u.email || "Unnamed",
        username: profile?.username ?? null,
        email: u.email ?? "",
        avatarUrl: profile?.avatar_url ?? null,
        role: (profile?.role ?? "author") as "admin" | "author",
        postCount: counts.get(u.id) ?? 0,
        lastSignIn: u.last_sign_in_at ?? null,
        invited: Boolean(u.invited_at && !u.last_sign_in_at),
      }
    })
    .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name) : a.role === "admin" ? -1 : 1))

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading title="Users" description="Invite writers, change roles and manage access." />
      <UsersManager users={users} currentUserId={session.user.id} />
    </div>
  )
}
