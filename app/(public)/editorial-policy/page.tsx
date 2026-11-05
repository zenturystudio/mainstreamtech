import type { Metadata } from "next"
import Link from "next/link"
import { Container } from "@/components/shared/container"
import { JsonLd } from "@/components/shared/json-ld"
import { siteConfig } from "@/lib/site"
import { absoluteUrl } from "@/lib/utils"

export const metadata: Metadata = {
  title: "Editorial Policy and Corrections",
  description: "How Mainstream Tech reports, sources and corrects its stories, how we use AI tools, and how to contact the newsroom.",
  alternates: { canonical: "/editorial-policy" },
}

// Change this date whenever the policy text changes.
const LAST_UPDATED = "6 November 2026"

const sections = [
  { id: "standards", title: "Our standards" },
  { id: "sourcing", title: "Sources and fact-checking" },
  { id: "corrections", title: "Corrections" },
  { id: "updates", title: "Updates to developing stories" },
  { id: "ai", title: "How we use AI" },
  { id: "independence", title: "Independence and advertising" },
  { id: "feedback", title: "Contact the newsroom" },
]

export default function EditorialPolicyPage() {
  const url = absoluteUrl("/editorial-policy")
  return (
    <Container className="max-w-3xl pt-12 sm:pt-16">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "@id": url,
            url,
            name: "Editorial Policy and Corrections",
            inLanguage: "en-GB",
            isPartOf: { "@id": absoluteUrl("/#website") },
            about: { "@id": absoluteUrl("/#organization") },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
              { "@type": "ListItem", position: 2, name: "About", item: absoluteUrl("/about") },
              { "@type": "ListItem", position: 3, name: "Editorial policy", item: url },
            ],
          },
        ]}
      />

      <p className="font-mono text-xs tracking-widest text-brand uppercase">Editorial policy</p>
      <h1 className="mt-3 text-4xl leading-[1.1] font-bold tracking-tight sm:text-5xl">How we report, and how we put things right</h1>
      <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
        {siteConfig.name} covers technology, AI, business, politics and international affairs. This page explains the standards
        every story is held to. Last updated {LAST_UPDATED}.
      </p>

      <nav aria-label="On this page" className="mt-10 rounded-2xl border p-6">
        <p className="font-semibold">On this page</p>
        <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-muted-foreground hover:text-foreground hover:underline hover:underline-offset-4">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="prose-policy mt-12 flex flex-col gap-12 leading-relaxed text-foreground/90 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_li]:mt-2 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6">
        <section>
          <h2 id="standards">Our standards</h2>
          <p>We aim to be accurate, fair and clear. In practice that means:</p>
          <ul>
            <li>We report what is known, say what is not yet known, and keep the two apart.</li>
            <li>We separate news from analysis. Opinion and analysis are labelled as such.</li>
            <li>We name the people and organisations a story is about, and give them a fair chance to respond where a story is critical of them.</li>
            <li>We write headlines that match the story underneath them.</li>
            <li>We use UK English and give figures in pounds where we can, with the source currency alongside.</li>
          </ul>
        </section>

        <section>
          <h2 id="sourcing">Sources and fact-checking</h2>
          <p>
            We prefer primary sources: official statements, court and regulatory filings, company results, central bank and government
            data, and on-the-record interviews. When we rely on another outlet&apos;s reporting, we say so and link to it.
          </p>
          <ul>
            <li>Facts, figures, dates and quotes are checked against their source before publishing.</li>
            <li>Where a claim can&apos;t be independently confirmed, we attribute it (&ldquo;according to&hellip;&rdquo;, &ldquo;reported by&hellip;&rdquo;).</li>
            <li>We link to our sources in the story wherever we can, so readers can check them.</li>
            <li>We protect confidential sources, and only use them when the information can&apos;t be obtained on the record.</li>
          </ul>
        </section>

        <section>
          <h2 id="corrections">Corrections</h2>
          <p>
            When we get something wrong, we fix it quickly and say so. A correction note at the end of the story explains what was
            wrong and what we changed, and the story shows the date it was updated. We don&apos;t quietly rewrite errors.
          </p>
          <p>
            Spelling, grammar and formatting fixes that don&apos;t change the meaning of a story are made without a note.
          </p>
          <p>
            To report an error, email{" "}
            <a href={`mailto:${siteConfig.email}?subject=Correction`} className="font-medium text-brand underline underline-offset-4">
              {siteConfig.email}
            </a>{" "}
            with the story link and what you think is wrong. We review every report.
          </p>
        </section>

        <section>
          <h2 id="updates">Updates to developing stories</h2>
          <p>
            Some stories, such as elections, interest rate decisions and market moves, change while we are covering them. We update
            those stories as new information comes in, show the time of the update, and mark clearly what has changed.
          </p>
        </section>

        <section>
          <h2 id="ai">How we use AI</h2>
          <p>
            We use AI tools to help with research, summarising documents and drafting. AI does not decide what we publish. Facts,
            figures and quotes in AI-assisted work are checked against their sources, as with any other story, and we never use AI
            to invent quotes or sources.
          </p>
          <p>
            Images created with AI are used only as illustrations, never to depict real events or real people as if they were
            photographs.
          </p>
        </section>

        <section>
          <h2 id="independence">Independence and advertising</h2>
          <p>
            Advertisers and sponsors have no say over our coverage. Sponsored content and affiliate links are always labelled. We
            don&apos;t accept payment for positive coverage, and we don&apos;t give advance copies of stories to their subjects for approval.
          </p>
          <p>Nothing we publish is financial, investment, legal or medical advice.</p>
        </section>

        <section>
          <h2 id="feedback">Contact the newsroom</h2>
          <p>
            For corrections, complaints, story tips or questions about this policy, email{" "}
            <a href={`mailto:${siteConfig.email}`} className="font-medium text-brand underline underline-offset-4">
              {siteConfig.email}
            </a>{" "}
            or use our{" "}
            <Link href="/contact" className="font-medium text-brand underline underline-offset-4">
              contact page
            </Link>
            . A real person reads every message.
          </p>
        </section>
      </div>
    </Container>
  )
}
