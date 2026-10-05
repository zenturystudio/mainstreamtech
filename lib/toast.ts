/**
 * Lazy toast for public pages: sonner (and its Toaster) is only downloaded
 * when a message is actually shown, instead of with every page's JS.
 * The admin keeps importing "sonner" directly.
 */
type Kind = "success" | "error"

declare global {
  interface Window {
    __mtToasterReady?: boolean
  }
}

/** Resolves once LazyToaster has mounted (toasts created earlier would be lost). */
function toasterReady(): Promise<void> {
  if (window.__mtToasterReady) return Promise.resolve()
  return new Promise((resolve) => {
    window.addEventListener("mt:toaster-ready", () => resolve(), { once: true })
    window.dispatchEvent(new Event("mt:toaster"))
  })
}

async function show(kind: Kind, message: string) {
  const [{ toast }] = await Promise.all([import("sonner"), toasterReady()])
  toast[kind](message)
}

export const notify = {
  success: (message: string) => void show("success", message),
  error: (message: string) => void show("error", message),
}
