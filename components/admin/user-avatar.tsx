import Image from "next/image"
import { cn } from "@/lib/utils"

export function initials(name: string | null | undefined) {
  return (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function UserAvatar({ name, src, size = 32, className }: { name: string | null | undefined; src?: string | null; size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand/10 font-semibold text-brand", className)}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.38) }}
    >
      {src ? <Image src={src} alt="" fill sizes={`${size * 2}px`} className="object-cover" /> : initials(name)}
    </span>
  )
}
