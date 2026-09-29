import { Skeleton } from "@/components/ui/skeleton"
import { Container } from "@/components/shared/container"

export function PostCardSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="aspect-[16/10] rounded-2xl" />
      <Skeleton className="h-5 w-24 rounded-full" />
      <Skeleton className="h-6 w-11/12" />
      <Skeleton className="h-4 w-full" />
      <div className="flex items-center gap-2">
        <Skeleton className="size-7 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  )
}

export function PostGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ListingPageSkeleton() {
  return (
    <Container aria-busy="true" aria-label="Loading">
      <div className="border-b pt-16 pb-12">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="mt-4 h-12 w-72" />
        <Skeleton className="mt-5 h-5 w-full max-w-xl" />
      </div>
      <div className="pt-12">
        <PostGridSkeleton />
      </div>
    </Container>
  )
}
