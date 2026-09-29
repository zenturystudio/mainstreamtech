import type { Metadata } from "next"
import { PageHeading } from "@/components/admin/page-heading"
import { PasswordForm, ProfileForm } from "@/components/admin/profile-forms"
import { requireUser } from "@/lib/auth"

export const metadata: Metadata = { title: "Profile" }

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ setPassword?: string }> }) {
  const [{ user, profile }, { setPassword }] = await Promise.all([requireUser(), searchParams])

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeading title="Profile" description="How you appear on the site, and your sign-in details." className="mb-2" />
      {setPassword && <PasswordForm highlight />}
      <ProfileForm
        email={user.email ?? ""}
        defaults={{
          full_name: profile.full_name ?? "",
          username: profile.username ?? "",
          bio: profile.bio ?? "",
          avatar_url: profile.avatar_url,
        }}
      />
      {!setPassword && <PasswordForm />}
    </div>
  )
}
