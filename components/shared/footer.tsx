import Link from "next/link"
import { Container } from "@/components/shared/container"
import { Logo } from "@/components/shared/logo"
import { NewsletterForm } from "@/components/shared/newsletter-form"
import { SocialLinks } from "@/components/shared/social-links"
import { getCategories, getSiteSettings } from "@/lib/queries/public"
import { siteConfig } from "@/lib/site"

export async function Footer() {
  const [categories, settings] = await Promise.all([getCategories(), getSiteSettings()])

  return (
    <footer className="mt-24 border-t bg-muted/30">
      <Container className="grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo src={settings.logo_url} />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{settings.site_description}</p>
          <a href={`mailto:${siteConfig.email}`} className="mt-4 block text-sm font-medium hover:text-brand">
            {siteConfig.email}
          </a>
          <SocialLinks className="mt-6" />
        </div>

        <FooterColumn title="Explore" className="lg:col-span-2">
          {siteConfig.nav.map((item) => (
            <FooterLink key={item.href} href={item.href}>
              {item.label}
            </FooterLink>
          ))}
          <FooterLink href="/search">Search</FooterLink>
        </FooterColumn>

        <FooterColumn title="Categories" className="lg:col-span-2">
          {categories.map((c) => (
            <FooterLink key={c.id} href={`/category/${c.slug}`}>
              {c.name}
            </FooterLink>
          ))}
        </FooterColumn>

        <div className="md:col-span-2 lg:col-span-4">
          <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">Newsletter</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            One email a week with our best stories. No spam, unsubscribe anytime.
          </p>
          <NewsletterForm id="footer-newsletter" className="mt-4" />
        </div>
      </Container>
      <div className="border-t">
        <Container className="flex flex-col gap-2 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
          <p>{siteConfig.location}</p>
        </Container>
      </div>
    </footer>
  )
}

function FooterColumn({ title, className, children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <h2 className="font-mono text-xs tracking-widest text-muted-foreground uppercase">{title}</h2>
      <ul className="mt-4 flex flex-col gap-2.5">{children}</ul>
    </div>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="text-sm text-foreground/80 transition-colors hover:text-brand">
        {children}
      </Link>
    </li>
  )
}
