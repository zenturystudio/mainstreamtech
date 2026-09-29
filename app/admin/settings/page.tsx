import type { Metadata } from "next"
import { PageHeading } from "@/components/admin/page-heading"
import { SettingsForm } from "@/components/admin/settings-form"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Settings" }

export default async function SettingsPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from("site_settings").select("*").eq("id", 1).single()
  const social = (data?.social_links ?? {}) as Record<string, string>

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading title="Settings" description="Site-wide details used across the public site." />
      <SettingsForm
        defaults={{
          site_name: data?.site_name ?? "Mainstream Tech",
          site_description: data?.site_description ?? "",
          logo_url: data?.logo_url ?? null,
          posts_per_page: data?.posts_per_page ?? 9,
          social_links: {
            x: social.x ?? "",
            facebook: social.facebook ?? "",
            linkedin: social.linkedin ?? "",
            youtube: social.youtube ?? "",
            instagram: social.instagram ?? "",
          },
        }}
      />
    </div>
  )
}
