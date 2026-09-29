"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type Props = {
  /** Omit when opening programmatically (with defaultOpen). */
  trigger?: React.ReactNode
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  title: string
  description: React.ReactNode
  confirmLabel?: string
  destructive?: boolean
  /** Return false to keep the dialog open (e.g. on error). */
  onConfirm: () => Promise<boolean | void> | boolean | void
}

export function ConfirmDialog({ trigger, defaultOpen = false, onOpenChange, title, description, confirmLabel = "Delete", destructive = true, onConfirm }: Props) {
  const [open, setOpenState] = useState(defaultOpen)
  const [pending, startTransition] = useTransition()
  const setOpen = (o: boolean) => {
    setOpenState(o)
    onOpenChange?.(o)
  }

  return (
    <AlertDialog open={open} onOpenChange={(o) => !pending && setOpen(o)}>
      {trigger && <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild={typeof description !== "string"}>
            {typeof description === "string" ? description : <div>{description}</div>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <Button
            variant={destructive ? "destructive" : "default"}
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const keepOpen = (await onConfirm()) === false
                if (!keepOpen) setOpen(false)
              })
            }
          >
            {pending && <Loader2 className="animate-spin" />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
