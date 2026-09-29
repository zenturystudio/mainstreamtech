import "server-only"
import type { Session } from "@/lib/auth"
import { IMAGE_BUCKET } from "@/lib/storage"
import { createClient } from "@/lib/supabase/server"

export type MediaItem = { path: string; name: string; url: string; size: number; createdAt: string | null; ownerId: string }

/** Admins see every upload; authors see their own folder. Files live at {user_id}/{file}. */
export async function listMedia(session: Session): Promise<MediaItem[]> {
  const supabase = await createClient()
  const bucket = supabase.storage.from(IMAGE_BUCKET)

  let folders = [session.user.id]
  if (session.isAdmin) {
    const { data } = await bucket.list("", { limit: 1000 })
    // Folders come back as entries without an id.
    folders = (data ?? []).filter((e) => e.id === null).map((e) => e.name)
  }

  const lists = await Promise.all(
    folders.map(async (folder) => {
      const { data } = await bucket.list(folder, { limit: 1000, sortBy: { column: "created_at", order: "desc" } })
      return (data ?? [])
        .filter((f) => f.id && f.name !== ".emptyFolderPlaceholder")
        .map((f) => {
          const path = `${folder}/${f.name}`
          return {
            path,
            name: f.name.replace(/^\d+-/, ""),
            url: bucket.getPublicUrl(path).data.publicUrl,
            size: Number((f.metadata as { size?: number } | null)?.size ?? 0),
            createdAt: f.created_at ?? null,
            ownerId: folder,
          }
        })
    })
  )

  return lists.flat().sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
}
