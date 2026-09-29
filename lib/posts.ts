export type PostStatus = "draft" | "published" | "scheduled"

/**
 * What readers actually see. A 'scheduled' post goes live on its own once
 * published_at passes (RLS handles visibility), so it displays as published.
 */
export function effectiveStatus(status: PostStatus, publishedAt: string | null): PostStatus {
  if (status === "scheduled" && publishedAt && new Date(publishedAt).getTime() <= Date.now()) return "published"
  return status
}
