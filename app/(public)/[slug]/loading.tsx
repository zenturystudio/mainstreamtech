import { Container } from "@/components/shared/container"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading article">
      <Container className="max-w-4xl pt-14">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-10 h-6 w-24 rounded-full" />
        <Skeleton className="mt-5 h-14 w-full" />
        <Skeleton className="mt-3 h-14 w-2/3" />
        <Skeleton className="mt-6 h-6 w-full" />
        <div className="mt-8 flex items-center gap-3 border-y py-5">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="h-4 w-56" />
        </div>
      </Container>
      <Container className="mt-10 max-w-6xl">
        <Skeleton className="aspect-[2/1] rounded-3xl" />
      </Container>
      <Container className="mt-14 max-w-[720px] space-y-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-5" style={{ width: `${85 + ((i * 7) % 15)}%` }} />
        ))}
      </Container>
    </div>
  )
}
