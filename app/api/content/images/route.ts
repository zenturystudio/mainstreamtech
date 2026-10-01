import { NextResponse } from "next/server"
import { MAX_IMAGE_BYTES, apiError, authError, rateLimit, sniffImage, storeImage } from "@/lib/clomark"

/**
 * Clomark image upload: POST multipart/form-data with field "file"
 * (JPG, PNG or WebP, ≤ 10 MB) and header X-API-Key. Returns { url } on our
 * own storage (Admin → Media → Blog media, "clomark" folder).
 */

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(request: Request) {
  const limited = await rateLimit(request, "images")
  if (limited) return limited
  const denied = authError(request)
  if (denied) return denied

  if (!request.headers.get("content-type")?.toLowerCase().includes("multipart/form-data"))
    return apiError(415, 'Send the image as multipart/form-data in a field named "file"')
  // Multipart adds a little overhead around the file itself.
  if (Number(request.headers.get("content-length") ?? 0) > MAX_IMAGE_BYTES + 64 * 1024) return apiError(413, "Image is larger than 10 MB")

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return apiError(400, "Could not read the multipart body")
  }
  const file = form.get("file")
  if (!(file instanceof File)) return apiError(400, 'Missing image in the "file" field')
  if (file.size === 0) return apiError(400, "The image is empty")
  if (file.size > MAX_IMAGE_BYTES) return apiError(413, "Image is larger than 10 MB")

  const bytes = new Uint8Array(await file.arrayBuffer())
  // Check the real file type from its bytes, not the declared type or name.
  const kind = sniffImage(bytes)
  if (!kind) return apiError(415, "Only JPG, PNG or WebP images are accepted")

  try {
    const url = await storeImage(bytes, kind, file.name || "image")
    return NextResponse.json({ url }, { status: 201, headers: { "Cache-Control": "no-store" } })
  } catch (e) {
    console.error("[clomark] image upload failed:", (e as Error).message)
    return apiError(500, "Could not store the image. Try again later.")
  }
}
