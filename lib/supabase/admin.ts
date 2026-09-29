import "server-only"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database.types"

/**
 * Service-role client. Bypasses RLS — only use inside server actions that have
 * already verified the caller is an admin (e.g. inviting users, changing roles).
 */
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
