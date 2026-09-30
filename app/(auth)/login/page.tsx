import type { Metadata } from "next"
import { Logo } from "@/components/shared/logo"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { siteUrl } from "@/lib/urls"
import { LoginForm } from "./login-form"

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
}

// Shown when an invite or password-reset link from email fails (see /auth/confirm).
const errors: Record<string, string> = {
  link: "That link is invalid or has expired. Ask an administrator for a new one.",
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <main className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
          {error && errors[error] && (
            <p role="alert" className="mb-5 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {errors[error]}
            </p>
          )}
          <LoginForm next={next} siteHref={siteUrl("/")} />
        </div>
      </main>
    </div>
  )
}
