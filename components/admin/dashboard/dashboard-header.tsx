"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DashboardRange } from "@/lib/queries/admin"
import { cn } from "@/lib/utils"

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

/** "Good morning, {name}!" (in the viewer's local time) with Refresh and period selector. */
export function DashboardHeader({ firstName, range }: { firstName: string; range: DashboardRange }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()
  // Rendered after mount so the greeting follows the viewer's clock, not the server's.
  const [greeting, setGreeting] = useState("Welcome back")
  useEffect(() => setGreeting(greetingFor(new Date().getHours())), [])

  function setRange(value: string) {
    const next = new URLSearchParams(params)
    if (value === "month") next.delete("range")
    else next.set("range", value)
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }))
  }

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        {greeting}, {firstName}!
      </h1>
      <div className="flex items-center gap-2">
        <Button variant="outline" className="h-10 rounded-xl bg-background" disabled={pending} onClick={() => startTransition(() => router.refresh())}>
          <RefreshCw className={cn(pending && "animate-spin")} /> Refresh
        </Button>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="h-10 w-32 rounded-xl bg-background" aria-label="Period">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="week">Weekly</SelectItem>
            <SelectItem value="month">Monthly</SelectItem>
            <SelectItem value="year">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
