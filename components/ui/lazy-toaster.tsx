"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const Toaster = dynamic(
  () =>
    import("@/components/ui/sonner").then(({ Toaster }) => {
      // Announces itself after the real Toaster has subscribed (child effects run first).
      function ReadyToaster() {
        useEffect(() => {
          window.__mtToasterReady = true
          window.dispatchEvent(new Event("mt:toaster-ready"))
        }, [])
        return <Toaster richColors closeButton />
      }
      return ReadyToaster
    }),
  { ssr: false }
)

/** Mounts the Toaster only once a toast is requested (see lib/toast.ts). */
export function LazyToaster() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (on) return
    const enable = () => setOn(true)
    window.addEventListener("mt:toaster", enable, { once: true })
    return () => window.removeEventListener("mt:toaster", enable)
  }, [on])
  return on ? <Toaster /> : null
}
