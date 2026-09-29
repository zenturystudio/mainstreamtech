import { createClient } from "@/lib/supabase/client"

export const IMAGE_BUCKET = "blog-images"
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]

export function validateImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Only JPG, PNG, WebP, GIF or AVIF images can be uploaded."
  if (file.size > MAX_IMAGE_BYTES) return `“${file.name}” is larger than 5 MB.`
  return null
}

/**
 * Uploads straight from the browser to Supabase Storage. Storage RLS only
 * allows writes under the user's own folder: {user_id}/{timestamp}-{filename}.
 */
export async function uploadImage(file: File): Promise<{ url: string; path: string }> {
  const problem = validateImage(file)
  if (problem) throw new Error(problem)

  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Your session has expired. Please sign in again.")

  const dot = file.name.lastIndexOf(".")
  const base = (dot > 0 ? file.name.slice(0, dot) : file.name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "image"
  const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "jpg"
  const path = `${user.id}/${Date.now()}-${base}.${ext}`

  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { cacheControl: "31536000", contentType: file.type })
  if (error) throw new Error(error.message)

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, path }
}
