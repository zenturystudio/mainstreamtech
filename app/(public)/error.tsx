"use client"

import { useEffect } from "react"
import Link from "next/link"
import { RotateCcw } from "lucide-react"
import { Container } from "@/components/shared/container"
import { Button } from "@/components/ui/button"

export default function PublicError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Container className="flex flex-col items-center py-32 text-center">
      <p className="font-mono text-sm tracking-widest text-destructive uppercase">Something went wrong</p>
      <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">We couldn&apos;t load this page</h1>
      <p className="mt-4 max-w-md text-muted-foreground">It&apos;s probably temporary. Try again, or head back to the home page.</p>
      <div className="mt-8 flex gap-3">
        <Button size="lg" className="h-11 px-5" onClick={reset}>
          <RotateCcw /> Try again
        </Button>
        <Button asChild variant="outline" size="lg" className="h-11 px-5">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </Container>
  )
}
