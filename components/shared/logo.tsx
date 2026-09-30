import Image from "next/image"
import Link from "next/link"
import { cdnImageUrl, isCdnEligible } from "@/lib/cdn"
import { cn } from "@/lib/utils"
import logoDark from "@/public/logo-dark.png"
import logoWhite from "@/public/logo-white.png"

/**
 * Brand wordmark from mainstreamtech.co.uk; the white version shows in dark mode.
 * A logo uploaded in CMS Settings (`src`) replaces both.
 */
export function Logo({ className, src }: { className?: string; src?: string | null }) {
  return (
    <Link href="/" className={cn("inline-flex shrink-0 items-center", className)} aria-label="Mainstream Tech home">
      {src ? (
        // Plain <img> keeps the upload's own aspect ratio; the file still comes via the image CDN.
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary aspect ratio from an upload
        <img src={isCdnEligible(src) ? cdnImageUrl(src, 640) : src} alt="" className="h-[22px] w-auto sm:h-6" />
      ) : (
        <>
          <Image src={logoDark} alt="" priority className="h-[22px] w-auto sm:h-6 dark:hidden" />
          <Image src={logoWhite} alt="" priority className="hidden h-[22px] w-auto sm:h-6 dark:block" />
        </>
      )}
    </Link>
  )
}
