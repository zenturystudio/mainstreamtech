// WordPress stories carried their FAQs as an inline-styled <div class="faq-section">
// of <details> blocks. This pulls them out into the post's FAQ list (rendered by
// the site's own FAQ section, with FAQPage schema) and removes the block from the body.

export type Faq = { question: string; answer: string }

const NAMED: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", hellip: "…", ndash: "–", mdash: "—", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“" }
const decode = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED[name.toLowerCase()] ?? m)
const text = (html: string) =>
  decode(html.replace(/<br\s*\/?>/gi, " ").replace(/<\/p>\s*<p[^>]*>/gi, "\n\n").replace(/<[^>]+>/g, " "))
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim()

export function extractFaqSection(html: string): { content: string; faqs: Faq[] } {
  const faqs: Faq[] = []
  for (const m of html.matchAll(/<details\b[^>]*>([\s\S]*?)<\/details>/g)) {
    const summary = m[1].match(/<summary\b[^>]*>([\s\S]*?)<\/summary>/)?.[1] ?? ""
    const question = text(summary.replace(/<span class="faq-arrow"[\s\S]*?<\/span>/g, ""))
    const answer = text(m[1].replace(/<summary\b[\s\S]*?<\/summary>/, ""))
    if (question && answer) faqs.push({ question: question.slice(0, 200), answer: answer.slice(0, 2000) })
  }
  if (!faqs.length) return { content: html, faqs }

  let content = html
  const start = content.search(/<div class="faq-section"/)
  if (start >= 0) {
    // Find the matching closing </div> for the faq-section wrapper.
    const tag = /<\/?div\b[^>]*>/g
    tag.lastIndex = start
    let depth = 0
    let end = -1
    for (let t; (t = tag.exec(content)); ) {
      depth += t[0].startsWith("</") ? -1 : 1
      if (depth === 0) {
        end = tag.lastIndex
        break
      }
    }
    if (end > 0) content = content.slice(0, start) + content.slice(end)
  } else {
    content = content.replace(/<details\b[\s\S]*?<\/details>/g, "")
  }
  content = content.replace(/<style\b[\s\S]*?<\/style>/g, "").replace(/<p>\s*<\/p>/g, "").trim()
  return { content, faqs: faqs.slice(0, 20) }
}

// Older stories wrote FAQs as plain blocks under an "FAQs" heading, in a few
// shapes: <h3>1. Q?</h3><p>A</p>, <li><strong>Q?</strong><br>A</li>,
// <p><strong>Q1: Q?<br></strong>A</p>, or <p><strong>Q?</strong></p><p>A</p>.
const BLOCK = /<(h[1-6]|p|ol|ul)\b[^>]*>([\s\S]*?)<\/\1>/g
const cleanQuestion = (q: string) => q.replace(/^(?:Q\d+\s*[:.)]|\d+\s*[.)])\s*/i, "").trim()
const isQuestion = (s: string) => /\?\s*$/.test(s)

/** Splits "<strong>Q?</strong><br>A" (strong may wrap the <br>) into Q and A. */
function splitInline(html: string): Faq | null {
  const m = html.match(/^\s*<strong>([\s\S]*?)<\/strong>([\s\S]*)$/)
  if (!m) return null
  const question = cleanQuestion(text(m[1]))
  const answer = text(m[2])
  return isQuestion(question) && answer ? { question, answer } : null
}

export function extractFaqHeadingSection(html: string): { content: string; faqs: Faq[] } {
  const heading = html.match(/<(h[2-4])\b[^>]*>(?:(?!<\/h[2-4]>)[\s\S])*?(?:FAQs?|Frequently Asked Questions)(?:(?!<\/h[2-4]>)[\s\S])*?<\/\1>/i)
  if (!heading || heading.index === undefined) return { content: html, faqs: [] }
  const start = heading.index
  BLOCK.lastIndex = start + heading[0].length

  const faqs: Faq[] = []
  let pending: string | null = null // question waiting for its answer paragraph(s)
  let end = BLOCK.lastIndex
  for (let b; (b = BLOCK.exec(html)); ) {
    if (html.slice(end, b.index).trim()) break // not contiguous
    const [whole, tag, inner] = b
    const plain = text(inner)
    if (tag.startsWith("h")) {
      const q = cleanQuestion(plain)
      if (!isQuestion(q)) break // next real section (e.g. Conclusion)
      pending = q
    } else if (tag === "ol" || tag === "ul") {
      const items = [...inner.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/g)].map((li) => splitInline(li[1]))
      if (!items.length || items.some((i) => !i)) break
      faqs.push(...(items as Faq[]))
      pending = null
    } else if (!plain) {
      // empty spacer paragraph
    } else if (splitInline(inner)) {
      faqs.push(splitInline(inner)!)
      pending = null
    } else if (/^\s*<strong>[\s\S]*<\/strong>\s*$/.test(inner) && isQuestion(cleanQuestion(plain))) {
      pending = cleanQuestion(plain)
    } else if (pending) {
      faqs.push({ question: pending, answer: plain })
      pending = null
    } else if (faqs.length && /^\s*[^<]/.test(inner) && end > start) {
      break // ordinary paragraph after the FAQs
    } else {
      break
    }
    end = b.index + whole.length
  }
  if (faqs.length < 2) return { content: html, faqs: [] }
  const content = (html.slice(0, start) + html.slice(end)).trim()
  return {
    content,
    faqs: faqs.slice(0, 20).map((f) => ({ question: f.question.slice(0, 200), answer: f.answer.slice(0, 2000) })),
  }
}
