import type { Metadata } from "next"
import { Download } from "lucide-react"
import { PageHeading } from "@/components/admin/page-heading"
import { SubscribersTable } from "@/components/admin/subscribers-table"
import { Button } from "@/components/ui/button"
import { requireAdmin } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Subscribers" }

export default async function SubscribersPage() {
  await requireAdmin()
  const supabase = await createClient()
  const { data } = await supabase.from("newsletter_subscribers").select("id, email, created_at").order("created_at", { ascending: false })
  const subscribers = data ?? []

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeading
        title="Subscribers"
        description={`${subscribers.length} ${subscribers.length === 1 ? "person gets" : "people get"} the weekly briefing.`}
        actions={
          subscribers.length > 0 && (
            <Button asChild variant="outline" className="h-9">
              <a href="/admin/subscribers/export" download>
                <Download /> Export CSV
              </a>
            </Button>
          )
        }
      />
      <SubscribersTable subscribers={subscribers} />
    </div>
  )
}
