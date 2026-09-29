import type { Metadata } from "next"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { siteUrl } from "@/lib/urls"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
}

const errors: Record<string, string> = {
  link: "That sign-in link is invalid or has expired. Request a new one.",
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="absolute top-4 right-4 left-4 flex items-center justify-between">
        <a href={siteUrl("/")} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Back to site
        </a>
        <ThemeToggle />
      </div>

      <main className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo />
          <p className="mt-3 text-sm text-muted-foreground">Sign in to the newsroom CMS</p>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          {error && errors[error] && (
            <p role="alert" className="mb-5 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors[error]}
            </p>
          )}
          <LoginForm next={next} />
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Accounts are created by an administrator.
        </p>
      </main>
    </div>
  )
}
