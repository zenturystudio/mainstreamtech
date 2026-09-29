import Link from "next/link"
import { Suspense } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/shared/container"
import { HeaderSearch } from "@/components/shared/header-search"
import { Logo } from "@/components/shared/logo"
import { MobileNav } from "@/components/shared/mobile-nav"
import { NavLinks } from "@/components/shared/nav-links"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { getCategories, getSiteSettings } from "@/lib/queries/public"

export async function Header() {
  const [categories, settings] = await Promise.all([getCategories(), getSiteSettings()])

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <Container className="flex h-16 items-center gap-2">
        <MobileNav categories={categories} />
        <Logo className="mr-4" src={settings.logo_url} />
        <div className="hidden lg:block">
          <NavLinks categories={categories} />
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <Suspense>
            <HeaderSearch className="hidden w-56 md:block xl:w-64" />
          </Suspense>
          <Button asChild variant="ghost" size="icon" className="md:hidden" aria-label="Search">
            <Link href="/search">
              <Search className="size-[18px]" />
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  )
}
