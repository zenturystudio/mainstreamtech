"use client"

import { useState } from "react"
import { Check, Link2 } from "lucide-react"
import { FaFacebookF, FaLinkedinIn, FaWhatsapp, FaXTwitter } from "react-icons/fa6"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ShareButtons({ url, title, className }: { url: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  const u = encodeURIComponent(url)
  const t = encodeURIComponent(title)

  const networks = [
    { label: "Share on X", href: `https://x.com/intent/post?url=${u}&text=${t}`, Icon: FaXTwitter },
    { label: "Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}`, Icon: FaFacebookF },
    { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`, Icon: FaLinkedinIn },
    { label: "Share on WhatsApp", href: `https://wa.me/?text=${t}%20${u}`, Icon: FaWhatsapp },
  ]

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      toast.success("Link copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy the link")
    }
  }

  const item =
    "grid size-9 place-items-center rounded-full border text-muted-foreground transition-colors hover:border-foreground/30 hover:bg-muted hover:text-foreground"

  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)}>
      {networks.map(({ label, href, Icon }) => (
        <li key={label}>
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className={item}>
            <Icon className="size-4" aria-hidden />
          </a>
        </li>
      ))}
      <li>
        <button type="button" onClick={copy} aria-label="Copy link" className={item}>
          {copied ? <Check className="size-4 text-green-600" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
        </button>
      </li>
    </ul>
  )
}
