import type { Faq } from "@/types/app"

/** Reads the posts.faqs JSON column defensively: keeps only complete, non-empty Q&A pairs. */
export function parseFaqs(value: unknown): Faq[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => ({
      question: typeof item?.question === "string" ? item.question.trim() : "",
      answer: typeof item?.answer === "string" ? item.answer.trim() : "",
    }))
    .filter((f) => f.question && f.answer)
}
