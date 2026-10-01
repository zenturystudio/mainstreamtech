"use client"

import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Faq } from "@/types/app"

const MAX_FAQS = 20

/** Question/answer pairs for a story's FAQ block and FAQPage schema. */
export function FaqEditor({ value, onChange }: { value: Faq[]; onChange: (faqs: Faq[]) => void }) {
  const update = (i: number, patch: Partial<Faq>) => onChange(value.map((f, j) => (j === i ? { ...f, ...patch } : f)))
  const move = (i: number, dir: -1 | 1) => {
    const next = [...value]
    ;[next[i], next[i + dir]] = [next[i + dir], next[i]]
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-4">
      {value.length === 0 && <p className="text-sm text-muted-foreground">No FAQs yet. They&apos;re optional; add them when a story answers common questions.</p>}

      {value.map((faq, i) => (
        <div key={i} className="rounded-xl border p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Question {i + 1}</span>
            <div className="flex gap-0.5">
              <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move question ${i + 1} up`}>
                <ArrowUp />
              </Button>
              <Button type="button" variant="ghost" size="icon-sm" disabled={i === value.length - 1} onClick={() => move(i, 1)} aria-label={`Move question ${i + 1} down`}>
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label={`Remove question ${i + 1}`}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`faq-q-${i}`} className="sr-only">
                Question {i + 1}
              </Label>
              <Input id={`faq-q-${i}`} value={faq.question} maxLength={200} placeholder="e.g. What is friend-shoring?" onChange={(e) => update(i, { question: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`faq-a-${i}`} className="sr-only">
                Answer {i + 1}
              </Label>
              <Textarea id={`faq-a-${i}`} value={faq.answer} rows={3} maxLength={2000} placeholder="A short, direct answer." onChange={(e) => update(i, { answer: e.target.value })} />
            </div>
          </div>
        </div>
      ))}

      {value.length < MAX_FAQS && (
        <Button type="button" variant="outline" className="self-start" onClick={() => onChange([...value, { question: "", answer: "" }])}>
          <Plus /> Add question
        </Button>
      )}
    </div>
  )
}
