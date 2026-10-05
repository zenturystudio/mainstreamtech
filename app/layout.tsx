import type { Metadata } from "next"
import { Geist_Mono, Playfair_Display, Roboto } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { LazyToaster } from "@/components/ui/lazy-toaster"
import { siteConfig } from "@/lib/site"
import "./globals.css"

// Brand fonts from mainstreamtech.co.uk: Roboto for text, Playfair Display for headlines.
const roboto = Roboto({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "700"] })
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name}: ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  openGraph: { siteName: siteConfig.name, type: "website", locale: "en_GB" },
  twitter: { card: "summary_large_image" },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // Font variables must live on <html>: Tailwind applies font-sans there.
    <html lang="en-GB" suppressHydrationWarning className={`${roboto.variable} ${playfair.variable} ${geistMono.variable}`}>
      {/* suppressHydrationWarning: browser extensions (e.g. ColorZilla's cz-shortcut-listen)
          add attributes to <body> before React loads. Only affects this element's own attributes. */}
      <body className="min-h-svh antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <LazyToaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
