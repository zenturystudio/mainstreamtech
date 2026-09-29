import type { Metadata } from "next"
import { Mail, Megaphone, Newspaper } from "lucide-react"
import { Container } from "@/components/shared/container"
import { SocialLinks } from "@/components/shared/social-links"
import { siteConfig } from "@/lib/site"
import { ContactForm } from "./contact-form"

export const metadata: Metadata = {
  title: "Contact",
  description: "Send a tip, pitch a story or ask about advertising with Mainstream Tech.",
  alternates: { canonical: "/contact" },
}

const channels = [
  { Icon: Newspaper, title: "News tips", body: "Know something we should cover? We protect our sources.", email: siteConfig.email },
  { Icon: Mail, title: "Editorial", body: "Corrections, guest posts and general questions.", email: siteConfig.email },
  { Icon: Megaphone, title: "Advertising & partnerships", body: "Sponsorships, events and collaborations.", email: siteConfig.email },
]

export default function ContactPage() {
  return (
    <Container className="grid gap-12 pt-12 sm:pt-16 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-5">
        <p className="font-mono text-xs tracking-widest text-brand uppercase">Contact</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Let&apos;s talk.</h1>
        <p className="mt-5 text-lg text-muted-foreground">
          Send us a tip, pitch a story or ask a question. A real person reads every message.
        </p>

        <ul className="mt-10 flex flex-col gap-6">
          {channels.map(({ Icon, title, body, email }) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{body}</p>
                <a href={`mailto:${email}`} className="mt-1 inline-block text-sm font-medium text-brand hover:underline hover:underline-offset-4">
                  {email}
                </a>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <p className="mb-3 text-sm font-medium">Follow us</p>
          <SocialLinks />
        </div>
      </div>

      <div className="lg:col-span-7">
        <ContactForm />
      </div>
    </Container>
  )
}
