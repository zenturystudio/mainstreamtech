import "server-only"
import type { Session } from "@/lib/auth"
import { BLOG_FOLDER, IMAGE_BUCKET, type MediaFolder } from "@/lib/storage"
import { createClient } from "@/lib/supabase/server"

export type MediaItem = {
  path: string
  name: string
  url: string
  size: number
  createdAt: string | null
  ownerId: string
  folder: MediaFolder
}

/**
 * Admins see every upload; authors see their own. Files live at
 * {user_id}/{file} (general) or {user_id}/blog/{file} (blog posts).
 * `only` limits the result to one folder type.
 */
export async function listMedia(session: Session, only?: MediaFolder): Promise<MediaItem[]> {
  const supabase = await createClient()
  const bucket = supabase.storage.from(IMAGE_BUCKET)

  let owners = [session.user.id]
  if (session.isAdmin) {
    const { data } = await bucket.list("", { limit: 1000 })
    // Folders come back as entries without an id.
    owners = (data ?? []).filter((e) => e.id === null).map((e) => e.name)
  }

  const listFolder = async (ownerId: string, folder: MediaFolder): Promise<MediaItem[]> => {
    const dir = folder === "blog" ? `${ownerId}/${BLOG_FOLDER}` : ownerId
    const { data } = await bucket.list(dir, { limit: 1000, sortBy: { column: "created_at", order: "desc" } })
    return (data ?? [])
      .filter((f) => f.id && f.name !== ".emptyFolderPlaceholder")
      .map((f) => {
        const path = `${dir}/${f.name}`
        return {
          path,
          name: f.name.replace(/^\d+-/, ""),
          url: bucket.getPublicUrl(path).data.publicUrl,
          size: Number((f.metadata as { size?: number } | null)?.size ?? 0),
          createdAt: f.created_at ?? null,
          ownerId,
          folder,
        }
      })
  }

  const folders: MediaFolder[] = only ? [only] : ["general", "blog"]
  const lists = await Promise.all(owners.flatMap((owner) => folders.map((folder) => listFolder(owner, folder))))
  return lists.flat().sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
}
