import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Estimated minutes to read an HTML string at ~225 wpm (minimum 1). */
export function readingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ")
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 225))
}

export function formatDate(date: string | Date, pattern = "MMM d, yyyy"): string {
  return format(new Date(date), pattern)
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function absoluteUrl(path = "/"): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3003"
  return new URL(path, base).toString()
}
