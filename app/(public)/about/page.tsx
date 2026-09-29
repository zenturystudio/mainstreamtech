import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BadgeCheck, BookOpen, Scale } from "lucide-react"
import { AuthorAvatar } from "@/components/blog/post-meta"
import { Container } from "@/components/shared/container"
import { Button } from "@/components/ui/button"
import { getAuthors, getCategories, getPosts } from "@/lib/queries/public"

export const metadata: Metadata = {
  title: "About",
  description: "Who we are, what we cover and how we work at Mainstream Tech.",
  alternates: { canonical: "/about" },
}

const principles = [
  {
    Icon: BookOpen,
    title: "Explain, don't shout",
    body: "Headlines tell you what happened. We focus on why it matters, with context you can use.",
  },
  {
    Icon: BadgeCheck,
    title: "Checked before published",
    body: "Every story is sourced and edited. When we get something wrong, we correct it openly.",
  },
  {
    Icon: Scale,
    title: "Independent",
    body: "Sponsored content is always labelled, and advertisers never shape our reporting.",
  },
]

export default async function AboutPage() {
  const [authors, posts, categories] = await Promise.all([getAuthors(), getPosts({ perPage: 1000 }), getCategories()])

  const stats = [
    { label: "Stories published", value: posts.total.toString() },
    { label: "Sections", value: categories.length.toString() },
    { label: "Writers", value: authors.length.toString() },
    { label: "Newsroom", value: "London" },
  ]

  return (
    <>
      <Container className="grid items-center gap-12 pt-12 sm:pt-20 lg:grid-cols-2">
        <div>
          <p className="font-mono text-xs tracking-widest text-brand uppercase">About us</p>
          <h1 className="mt-3 text-4xl leading-[1.1] font-bold tracking-tight sm:text-6xl">News that explains the world, not just the headlines.</h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Mainstream Tech is a London-based publication covering technology, AI, business, politics and international affairs. Our aim
            is simple: report clearly, add the context that matters, and respect our readers&apos; time.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-11 px-5">
              <Link href="/blog">
                Read the latest <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-11 px-5">
              <Link href="/contact">Get in touch</Link>
            </Button>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
          <Image
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&q=80&auto=format&fit=crop"
            alt="A team working together around a table"
            fill
            priority
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </Container>

      <Container className="mt-20">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border bg-border lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-background p-6 sm:p-8">
              <dt className="text-sm text-muted-foreground">{s.label}</dt>
              <dd className="mt-2 text-3xl font-bold tracking-tight tabular-nums sm:text-4xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </Container>

      <Container className="mt-24">
        <h2 className="text-3xl font-bold tracking-tight">How we work</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {principles.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border p-7">
              <span className="grid size-11 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </Container>

      <Container className="mt-24">
        <h2 className="text-3xl font-bold tracking-tight">Meet the team</h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {authors.map((a) => (
            <li key={a.id} className="group relative flex flex-col rounded-2xl border p-7 transition-colors hover:bg-muted/40">
              <AuthorAvatar author={a} size={64} />
              <h3 className="mt-5 text-lg font-semibold">
                <Link href={`/author/${a.username}`} className="after:absolute after:inset-0 group-hover:text-brand">
                  {a.full_name}
                </Link>
              </h3>
              <p className="text-sm text-muted-foreground">{a.title}</p>
              <p className="mt-3 line-clamp-3 leading-relaxed text-foreground/80">{a.bio}</p>
              <p className="mt-auto pt-5 text-sm font-medium text-brand">{a.postCount} stories →</p>
            </li>
          ))}
        </ul>
      </Container>
    </>
  )
}
