"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

const COPY_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="14" height="14" x="8" y="8" rx="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>'

/**
 * Renders sanitized, pre-highlighted article HTML (see lib/content.ts) and
 * adds a copy button to each code block after mount.
 */
export function PostBody({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return
    const buttons: HTMLButtonElement[] = []

    root.querySelectorAll("pre").forEach((pre) => {
      const button = document.createElement("button")
      button.type = "button"
      button.setAttribute("aria-label", "Copy code")
      button.className =
        "absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 font-sans text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
      button.innerHTML = `${COPY_ICON}<span>Copy</span>`
      button.addEventListener("click", async () => {
        const code = pre.querySelector("code")?.innerText ?? ""
        try {
          await navigator.clipboard.writeText(code)
          button.querySelector("span")!.textContent = "Copied!"
        } catch {
          button.querySelector("span")!.textContent = "Failed"
        }
        setTimeout(() => (button.querySelector("span")!.textContent = "Copy"), 2000)
      })
      pre.appendChild(button)
      buttons.push(button)
    })

    return () => buttons.forEach((b) => b.remove())
  }, [html])

  return (
    <div
      ref={ref}
      className={cn(
        "prose prose-lg prose-neutral max-w-none dark:prose-invert",
        "prose-headings:scroll-mt-24 prose-headings:font-bold prose-headings:tracking-tight",
        "prose-a:text-brand prose-a:underline-offset-4",
        "prose-blockquote:border-l-brand prose-blockquote:font-normal prose-blockquote:text-foreground",
        "prose-img:rounded-2xl prose-pre:my-8",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
