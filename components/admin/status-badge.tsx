import { cn } from "@/lib/utils"
import { effectiveStatus, type PostStatus } from "@/lib/posts"

const styles: Record<ReturnType<typeof effectiveStatus>, string> = {
  published: "bg-green-500/10 text-green-700 dark:text-green-400",
  scheduled: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  draft: "bg-muted text-muted-foreground",
}

export function StatusBadge({ status, publishedAt }: { status: PostStatus; publishedAt: string | null }) {
  const s = effectiveStatus(status, publishedAt)
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize", styles[s])}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {s}
    </span>
  )
}
