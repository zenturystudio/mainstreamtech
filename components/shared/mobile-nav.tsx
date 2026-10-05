"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Category } from "@/types/app"

// The panel (Radix dialog + focus trap) loads the first time the menu is
// wanted, not with every page. Pointer-down/hover starts the download early.
const loadSheet = () => import("@/components/shared/mobile-nav-sheet")
const MobileNavSheet = dynamic(loadSheet, { ssr: false })

export function MobileNav({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [wanted, setWanted] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={loadSheet}
        onPointerDown={loadSheet}
        onClick={() => {
          setWanted(true)
          setOpen(true)
        }}
      >
        <Menu className="size-5" />
      </Button>
      {wanted && <MobileNavSheet categories={categories} open={open} onOpenChange={setOpen} />}
    </>
  )
}
