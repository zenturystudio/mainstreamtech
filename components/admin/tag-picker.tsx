"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Check, Loader2, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { createTagQuick } from "@/lib/actions/taxonomy"
import { cn, slugify } from "@/lib/utils"

type Tag = { id: string; name: string; slug: string }

/** Multi-select for post tags, with create-on-the-fly. */
export function TagPicker({ tags, value, onChange }: { tags: Tag[]; value: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [all, setAll] = useState(tags)
  const [creating, startCreate] = useTransition()

  const selected = value.map((id) => all.find((t) => t.id === id)).filter((t): t is Tag => Boolean(t))
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  const exact = all.some((t) => t.slug === slugify(query))

  function create() {
    const name = query.trim()
    if (!name) return
    startCreate(async () => {
      const result = await createTagQuick(name)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      setAll((prev) => (prev.some((t) => t.id === result.tag.id) ? prev : [...prev, result.tag].sort((a, b) => a.name.localeCompare(b.name))))
      if (!value.includes(result.tag.id)) onChange([...value, result.tag.id])
      setQuery("")
    })
  }

  return (
    <div className="flex flex-col gap-2">
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <li key={t.id}>
              <span className="inline-flex items-center gap-1 rounded-full bg-muted py-1 pr-1 pl-2.5 text-xs font-medium">
                {t.name}
                <button type="button" onClick={() => toggle(t.id)} className="grid size-4 place-items-center rounded-full hover:bg-foreground/10" aria-label={`Remove ${t.name}`}>
                  <X className="size-3" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full justify-start text-muted-foreground">
            <Plus /> Add tags
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or create a tag…"
              value={query}
              onValueChange={setQuery}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim() && !exact) {
                  e.preventDefault()
                  create()
                }
              }}
            />
            <CommandList>
              <CommandEmpty>{query.trim() ? "No matching tags." : "No tags yet."}</CommandEmpty>
              {query.trim() && !exact && (
                <CommandGroup>
                  <CommandItem value={`__create__${query}`} onSelect={create} disabled={creating}>
                    {creating ? <Loader2 className="animate-spin" /> : <Plus />}
                    Create “{query.trim()}”
                  </CommandItem>
                </CommandGroup>
              )}
              <CommandGroup heading="Tags">
                {all.map((t) => (
                  <CommandItem key={t.id} value={t.name} onSelect={() => toggle(t.id)}>
                    <Check className={cn("size-4", value.includes(t.id) ? "opacity-100" : "opacity-0")} />
                    {t.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
