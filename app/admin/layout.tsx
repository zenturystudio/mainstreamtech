import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/admin-shell"
import { requireUser } from "@/lib/auth"
import { siteUrl } from "@/lib/urls"

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | Mainstream Tech CMS" },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireUser()

  return (
    <AdminShell
      siteHref={siteUrl("/")}
      user={{
        name: profile.full_name || profile.username || user.email || "Team member",
        email: user.email ?? "",
        avatarUrl: profile.avatar_url,
        role: profile.role as "admin" | "author",
      }}
    >
      {children}
    </AdminShell>
  )
}
