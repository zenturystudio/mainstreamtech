import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import { Footer } from "@/components/shared/footer"
import { Header } from "@/components/shared/header"
import { Container } from "@/components/shared/container"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main id="main" className="flex flex-1 items-center">
        <Container className="flex flex-col items-center py-24 text-center">
          <p className="font-mono text-sm tracking-widest text-brand uppercase">Error 404</p>
          <h1 className="mt-4 text-5xl font-bold tracking-tight sm:text-7xl">Page not found</h1>
          <p className="mt-5 max-w-md text-lg text-muted-foreground">
            The page you&apos;re looking for has moved, been deleted, or never existed.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-11 px-5">
              <Link href="/">
                <ArrowLeft /> Back to home
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-5">
              <Link href="/search">
                <Search /> Search articles
              </Link>
            </Button>
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  )
}
