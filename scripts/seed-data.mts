// Starter content loaded into Supabase by scripts/seed-content.ts.
// Shapes mirror the app types; ids here are placeholders (the DB assigns real ones).
import type { Author, Category, Post, Tag } from "@/types/app"

const img = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`

// Real Mainstream Tech bylines, with placeholder bios. No avatar photos:
// initials render until the writers upload their own.
export const authors: Author[] = [
  {
    id: "a1",
    full_name: "Kristen Elad",
    username: "kristen-elad",
    title: "Editor",
    avatar_url: null,
    bio: "Kristen edits Mainstream Tech and writes about technology, AI and the ideas shaping how we live and work.",
    role: "admin",
  },
  {
    id: "a2",
    full_name: "Mujtaba",
    username: "mujtaba",
    title: "Senior Writer",
    avatar_url: null,
    bio: "Mujtaba covers consumer technology, business and the tools professionals rely on every day.",
    role: "author",
  },
  {
    id: "a3",
    full_name: "Mainstream Tech Desk",
    username: "newsdesk",
    title: "Newsroom",
    avatar_url: null,
    bio: "Reporting and explainers from the Mainstream Tech newsroom in London.",
    role: "author",
  },
]

export const categories: Category[] = [
  { id: "c1", name: "Technology", slug: "technology", description: "Software, gadgets, security and the tech shaping everyday life." },
  { id: "c2", name: "AI", slug: "ai", description: "Artificial intelligence, large language models and the tools built on top of them." },
  { id: "c3", name: "Business", slug: "business", description: "Markets, companies and the economics behind the headlines." },
  { id: "c4", name: "Politics", slug: "politics", description: "Policy, elections and power, explained without the noise." },
  { id: "c5", name: "International", slug: "international", description: "Global affairs, diplomacy and world news from our London desk." },
]

export const tags: Tag[] = [
  { id: "t1", name: "JavaScript", slug: "javascript" },
  { id: "t2", name: "React", slug: "react" },
  { id: "t3", name: "TypeScript", slug: "typescript" },
  { id: "t4", name: "Machine Learning", slug: "machine-learning" },
  { id: "t5", name: "LLMs", slug: "llms" },
  { id: "t6", name: "Security", slug: "security" },
  { id: "t7", name: "Reviews", slug: "reviews" },
  { id: "t8", name: "Cloud", slug: "cloud" },
  { id: "t9", name: "Productivity", slug: "productivity" },
  { id: "t10", name: "Open Source", slug: "open-source" },
  { id: "t11", name: "Economy", slug: "economy" },
  { id: "t12", name: "Elections", slug: "elections" },
  { id: "t13", name: "Diplomacy", slug: "diplomacy" },
  { id: "t14", name: "Markets", slug: "markets" },
]

const by = (username: string) => authors.find((a) => a.username === username)!
const cat = (slug: string) => categories.find((c) => c.slug === slug)!
const tagged = (...slugs: string[]) => slugs.map((s) => tags.find((t) => t.slug === s)!)

type Seed = Omit<Post, "id" | "status" | "meta_title" | "meta_description">

const seeds: Seed[] = [
  {
    title: "How Global Supply Chains Are Being Redrawn",
    slug: "global-supply-chains-redrawn",
    excerpt: "Governments and manufacturers are rethinking where things get made. What 'friend-shoring' means, and who stands to win and lose.",
    cover_image_url: img("1589262804704-c5aa9e6def89"),
    published_at: "2026-09-29T07:30:00Z",
    featured: true,
    views: 0,
    reading_time: 7,
    author: by("newsdesk"),
    category: cat("international"),
    tags: tagged("diplomacy", "economy"),
    content: `
<p>For three decades, the logic of global manufacturing was simple: make things wherever it was cheapest. That logic is being rewritten. Governments now weigh resilience and security alongside cost, and companies are following.</p>
<h2>From offshoring to friend-shoring</h2>
<p>"Friend-shoring" describes moving production to countries considered reliable political partners. The goal is to avoid disruption from sudden export bans, sanctions or conflict, even if it costs more.</p>
<h3>Which industries are moving first</h3>
<ul>
<li><strong>Semiconductors:</strong> new fabrication plants are being subsidised across several regions.</li>
<li><strong>Batteries and critical minerals:</strong> the raw materials for the energy transition are now a strategic priority.</li>
<li><strong>Pharmaceuticals:</strong> shortages during recent crises exposed how concentrated production had become.</li>
</ul>
<h2>Who wins, who loses</h2>
<p>Mid-sized economies with stable institutions and available labour are attracting new investment. Consumers, meanwhile, may pay more for goods that were once optimised purely for price.</p>
<blockquote><p>Efficiency built the old supply chain. Resilience is building the new one, and resilience is never free.</p></blockquote>
<h2>What to watch</h2>
<p>Trade agreements, industrial subsidies and shipping costs will signal how far and how fast this shift goes. The map of global manufacturing in ten years may look very different from today's.</p>`,
  },
  {
    title: "Understanding Coalition Governments: How They Form and Why They Fall",
    slug: "coalition-governments-explained",
    excerpt: "When no party wins outright, deals get made. A plain-English guide to how coalitions are built, and what keeps them together.",
    cover_image_url: img("1529107386315-e1a2ed48a620"),
    published_at: "2026-09-27T10:00:00Z",
    featured: false,
    views: 0,
    reading_time: 6,
    author: by("kristen-elad"),
    category: cat("politics"),
    tags: tagged("elections"),
    content: `
<p>In many democracies, elections rarely hand a single party a majority. Instead, parties negotiate to form a coalition that can command enough votes to govern. The process can take days or months.</p>
<h2>How a coalition forms</h2>
<ol>
<li><strong>The count:</strong> parties tally which combinations reach a majority of seats.</li>
<li><strong>Negotiation:</strong> potential partners trade policy priorities and ministerial posts.</li>
<li><strong>The agreement:</strong> a written programme sets out what the government will and will not do.</li>
</ol>
<h2>What keeps them together</h2>
<p>Successful coalitions share a few traits: a clear written agreement, a mechanism for resolving disputes, and partners who each gain something visible to their voters.</p>
<h3>Why they fall apart</h3>
<p>Coalitions tend to break over issues the original agreement did not anticipate, or when one partner believes an early election would improve its position.</p>
<h2>The trade-off</h2>
<p>Coalitions can be slower and messier than single-party governments, but they often reflect a broader share of the electorate and force compromise on divisive issues.</p>`,
  },
  {
    title: "What Interest Rate Decisions Mean for Your Money",
    slug: "interest-rates-explained",
    excerpt: "Mortgages, savings and the price of your weekly shop: how a central bank decision travels from the committee room to your bank account.",
    cover_image_url: img("1569025743873-ea3a9ade89f9"),
    published_at: "2026-09-25T08:00:00Z",
    featured: false,
    views: 0,
    reading_time: 6,
    author: by("mujtaba"),
    category: cat("business"),
    tags: tagged("economy", "markets"),
    content: `
<p>When a central bank changes its base rate, the headline lasts a day. The effects last much longer, rippling through mortgages, savings, business investment and prices.</p>
<h2>Why rates change</h2>
<p>Central banks raise rates to cool inflation by making borrowing more expensive, and cut them to encourage spending when the economy slows.</p>
<h2>Where you feel it</h2>
<ul>
<li><strong>Mortgages:</strong> variable and tracker rates move almost immediately; fixed deals change when you remortgage.</li>
<li><strong>Savings:</strong> easy-access accounts usually follow the base rate, though often slowly.</li>
<li><strong>Credit cards and loans:</strong> new borrowing gets cheaper or dearer within weeks.</li>
</ul>
<h3>The lag nobody talks about</h3>
<p>Economists estimate it can take a year or more for a rate change to have its full effect on inflation, which is why central banks try to act before problems are obvious.</p>
<blockquote><p>A rate decision is a forecast in disguise: it reflects where policymakers think the economy is heading, not just where it is.</p></blockquote>`,
  },
  {
    title: "The New Space Race: Why Satellites Are Now Geopolitics",
    slug: "satellites-and-geopolitics",
    excerpt: "Internet constellations, navigation systems and earth observation have turned low orbit into contested territory.",
    cover_image_url: img("1451187580459-43490279c0fa"),
    published_at: "2026-09-21T09:00:00Z",
    featured: false,
    views: 0,
    reading_time: 8,
    author: by("newsdesk"),
    category: cat("international"),
    tags: tagged("diplomacy", "cloud"),
    content: `
<p>Space used to be the domain of a handful of national agencies. Today thousands of commercial satellites circle the planet, and the services they provide have become essential infrastructure.</p>
<h2>Why orbit matters</h2>
<p>Satellites deliver navigation, weather forecasting, financial timing signals and increasingly broadband internet. Losing them would disrupt everything from shipping to card payments.</p>
<h2>Crowded skies</h2>
<p>Large internet constellations are launching satellites by the thousand. That raises questions about collision risk, space debris and who gets to use the most valuable orbits.</p>
<h3>The rules are unfinished</h3>
<p>International space law was written when only a few nations could launch anything. Updating it for a commercial era is one of the quieter diplomatic challenges of the decade.</p>
<h2>What comes next</h2>
<p>Expect more countries to build independent navigation and communications capabilities, and more debate about how to keep orbit usable for everyone.</p>`,
  },
  {
    title: "How Tech Is Changing Election Campaigns",
    slug: "tech-changing-election-campaigns",
    excerpt: "Micro-targeted ads, AI-generated content and fact-checking at scale: the tools reshaping how campaigns reach voters.",
    cover_image_url: img("1611974789855-9c2a0a7236a3"),
    published_at: "2026-09-19T11:00:00Z",
    featured: false,
    views: 0,
    reading_time: 7,
    author: by("kristen-elad"),
    category: cat("politics"),
    tags: tagged("elections", "llms"),
    content: `
<p>Campaigns have always adopted the newest media, from radio to television to social networks. The current wave of technology is changing not just how messages are delivered, but how they are made.</p>
<h2>Targeting gets granular</h2>
<p>Digital advertising lets campaigns tailor messages to small groups of voters based on location, interests and behaviour. Regulators in several countries are debating how much of this should be allowed.</p>
<h2>AI enters the campaign</h2>
<ul>
<li>Drafting speeches, emails and social posts at high volume.</li>
<li>Translating materials for multilingual communities.</li>
<li>Producing synthetic images and audio, which raises serious concerns about deception.</li>
</ul>
<h3>Fighting back</h3>
<p>Platforms, newsrooms and election authorities are investing in detection tools, content labels and faster fact-checking to limit the spread of misleading material.</p>
<blockquote><p>The technology is neutral. The rules and norms around it will decide whether it strengthens or weakens democratic debate.</p></blockquote>`,
  },
  {
    title: "Small Business Guide to Cutting Costs Without Cutting Corners",
    slug: "small-business-cost-cutting",
    excerpt: "Practical ways to trim software, energy and supplier costs, based on what actually worked for the businesses we spoke to.",
    cover_image_url: img("1444653614773-995cb1ef9efa"),
    published_at: "2026-09-07T09:00:00Z",
    featured: false,
    views: 0,
    reading_time: 5,
    author: by("mujtaba"),
    category: cat("business"),
    tags: tagged("productivity", "economy"),
    content: `
<p>Rising costs squeeze small businesses first. The good news is that most have savings hiding in plain sight, and finding them rarely means worse service for customers.</p>
<h2>Start with subscriptions</h2>
<p>Software subscriptions accumulate quietly. List every tool, who uses it and what it costs. Most businesses find at least one duplicate or forgotten account.</p>
<h2>Renegotiate with suppliers</h2>
<ul>
<li>Ask for annual pricing in exchange for commitment.</li>
<li>Get two competing quotes before every renewal.</li>
<li>Consolidate orders to reach volume discounts.</li>
</ul>
<h2>Energy and premises</h2>
<p>Smart meters, efficient lighting and flexible workspace can cut overheads meaningfully, especially for teams that no longer need a desk for everyone every day.</p>
<p>The goal is not to spend as little as possible, but to spend deliberately on the things customers actually notice.</p>`,
  },
  {
    title: "React Server Components, Explained Without the Hype",
    slug: "server-components-explained",
    excerpt: "What Server Components actually change about how you build React apps, where they shine, and where they still fall short.",
    cover_image_url: img("1633356122544-f134324a6cee"),
    published_at: "2026-09-28T09:00:00Z",
    featured: true,
    views: 0,
    reading_time: 7,
    author: by("kristen-elad"),
    category: cat("technology"),
    tags: tagged("react", "javascript", "typescript"),
    content: `
<p>For most of React's life, every component you wrote was shipped to the browser, even the ones that only ever rendered static markup. Server Components flip that default. Components now run on the server unless you explicitly opt into the client, and the result is less JavaScript, faster pages and simpler data fetching.</p>
<h2>Why Server Components exist</h2>
<p>The problem they solve is simple to state: a page that shows a list of blog posts does not need the code that fetched those posts to run in the browser. It only needs the HTML. Yet for years we shipped the fetching logic, the formatting helpers and the markdown parser to every visitor.</p>
<p>Server Components let that work stay on the server. The browser receives a serialized description of the rendered tree and only downloads code for the parts that are actually interactive.</p>
<h3>The mental model</h3>
<p>Think of the server tree as a document that streams in, with interactive islands marked by <code>"use client"</code>. Everything above that boundary is free: no bundle cost, direct database access and no loading spinners for data you already have.</p>
<pre><code class="language-tsx">// app/blog/page.tsx — runs only on the server
export default async function BlogPage() {
  const posts = await db.post.findMany({ where: { published: true } })

  return (
    &lt;section&gt;
      {posts.map((post) =&gt; (
        &lt;PostCard key={post.id} post={post} /&gt;
      ))}
      &lt;LikeButton /&gt; {/* a client component */}
    &lt;/section&gt;
  )
}</code></pre>
<h2>What changes in practice</h2>
<ul>
<li><strong>Data fetching moves into components.</strong> No more prop-drilling results from a page-level loader.</li>
<li><strong>Secrets stay secret.</strong> API keys used in a Server Component never reach the browser.</li>
<li><strong>Bundles shrink.</strong> Heavy libraries used only for rendering stay on the server.</li>
</ul>
<h3>Composing server and client</h3>
<p>A client component cannot import a server component, but it can receive one as <code>children</code>. That single rule explains most of the patterns you will see in real codebases.</p>
<h2>Where they fall short</h2>
<p>Anything that needs state, effects or browser APIs still belongs on the client. The boundary is explicit, which is both a feature and a source of friction. Libraries that assume a browser environment need wrappers, and debugging now spans two runtimes.</p>
<blockquote><p>Default to the server. Reach for the client when you need interaction, and keep that boundary as low in the tree as you can.</p></blockquote>
<h2>The bottom line</h2>
<p>Server Components are not a new framework to learn from scratch. They are a better default. Start by moving data fetching up and interactivity down, and most of the benefits follow.</p>`,
  },
  {
    title: "How Large Language Models Actually Work",
    slug: "how-large-language-models-work",
    excerpt: "Tokens, attention and next-token prediction, explained for developers who want the real picture rather than the marketing one.",
    cover_image_url: img("1677442136019-21780ecad995"),
    published_at: "2026-09-26T08:30:00Z",
    featured: true,
    views: 0,
    reading_time: 9,
    author: by("newsdesk"),
    category: cat("ai"),
    tags: tagged("llms", "machine-learning"),
    content: `
<p>Large language models can write code, summarize contracts and hold a conversation, yet the core mechanism is surprisingly small: predict the next token, over and over. Understanding that mechanism will make you better at using these tools, and more realistic about their limits.</p>
<h2>Everything is a token</h2>
<p>Before a model sees your prompt, the text is split into tokens: common words, word fragments and punctuation. Each token maps to a vector of numbers called an embedding. The model never sees letters, only these numeric representations.</p>
<pre><code class="language-python">from tokenizer import encode

tokens = encode("Server Components are great")
print(tokens)       # [19045, 35152, 527, 2294]
print(len(tokens))  # 4</code></pre>
<h2>Attention is the key idea</h2>
<p>Attention lets every token weigh every other token when building its representation. That is how a model resolves "it" in a sentence, or tracks a variable name across a long code file.</p>
<h3>Layers upon layers</h3>
<p>A modern model stacks dozens of attention layers. Early layers pick up syntax, later layers capture meaning and intent. Nobody hand-codes these roles; they emerge during training.</p>
<h2>Training: predict the next token</h2>
<p>Training boils down to showing the model enormous amounts of text and nudging its parameters whenever it guesses the next token wrong. Capabilities like translation or arithmetic emerge from scale and data, not from explicit rules.</p>
<ol>
<li><strong>Pre-training</strong> on broad text teaches language and world knowledge.</li>
<li><strong>Fine-tuning</strong> on curated examples teaches the model to follow instructions.</li>
<li><strong>Preference training</strong> aligns responses with what people find helpful and safe.</li>
</ol>
<h2>What this means for you</h2>
<p>Because models predict plausible text, they can be confidently wrong. Give them the context they need, ask for sources where it matters, and verify anything important.</p>
<blockquote><p>A language model is not a database. It is a very good guesser that has read a great deal.</p></blockquote>`,
  },
  {
    title: "The Best Mechanical Keyboards for Developers in 2026",
    slug: "best-mechanical-keyboards-developers",
    excerpt: "We typed on a dozen boards for a month. These are the ones we would actually buy again, from budget picks to endgame boards.",
    cover_image_url: img("1587829741301-dc798b83add3"),
    published_at: "2026-09-24T12:00:00Z",
    featured: false,
    views: 0,
    reading_time: 6,
    author: by("mujtaba"),
    category: cat("technology"),
    tags: tagged("reviews", "productivity"),
    content: `
<p>A good keyboard will not make you a better programmer, but a bad one will absolutely make you a grumpier one. We spent a month rotating through twelve boards across long coding sessions to find the ones worth your desk space.</p>
<h2>What we looked for</h2>
<ul>
<li><strong>Build quality:</strong> no flex, no rattle, no creaky stabilizers.</li>
<li><strong>Switch feel:</strong> consistent actuation across the whole board.</li>
<li><strong>Layout:</strong> easy access to arrows, brackets and modifiers.</li>
<li><strong>Software:</strong> remapping that works without a background app.</li>
</ul>
<h2>Our picks</h2>
<h3>Best overall</h3>
<p>A solid aluminium 75% board with hot-swap sockets, gasket mounting and quiet tactile switches. It sounds great out of the box and supports open-source firmware for remapping.</p>
<h3>Best budget</h3>
<p>A plastic case keeps the price down, but the stock keycaps are thick PBT and the stabilizers are properly lubed. It leaves room in your budget for upgrades later.</p>
<h3>Best split keyboard</h3>
<p>If you have wrist or shoulder pain, a split layout is the single biggest ergonomic upgrade you can make. Expect a two-week adjustment period.</p>
<h2>The verdict</h2>
<p>Choose the layout first and switches second. Keycaps, cables and even switches can be changed later. The shape of the board cannot.</p>`,
  },
  {
    title: "Securing Your Web App: A Practical Checklist",
    slug: "web-app-security-checklist",
    excerpt: "The handful of protections that stop most real-world attacks, from content security policy to row level security.",
    cover_image_url: img("1555949963-ff9fe0c870eb"),
    published_at: "2026-09-22T10:00:00Z",
    featured: false,
    views: 0,
    reading_time: 8,
    author: by("kristen-elad"),
    category: cat("technology"),
    tags: tagged("security", "javascript"),
    content: `
<p>Most breaches do not involve clever zero-days. They involve missing basics. This checklist covers the protections that stop the majority of attacks we see in incident reports.</p>
<h2>Start with the basics</h2>
<ul>
<li>Serve everything over HTTPS and enable HSTS.</li>
<li>Hash passwords with a modern algorithm such as Argon2id.</li>
<li>Validate input on the server, always, even when the client validates too.</li>
</ul>
<h2>Defence in depth</h2>
<p>Assume some layer will fail. Row level security in your database means a bug in your API cannot leak another user's data.</p>
<pre><code class="language-sql">create policy "Users read own orders"
  on orders for select
  using (user_id = auth.uid());</code></pre>
<h3>Content Security Policy</h3>
<p>A strict CSP turns many cross-site scripting bugs into harmless console errors. Start in report-only mode, fix what breaks, then enforce.</p>
<h3>Rate limiting</h3>
<p>Login, signup and password reset endpoints are brute-force targets. Limit them per IP and per account.</p>
<h2>Keep dependencies patched</h2>
<p>Most exploited vulnerabilities are already public. Automate dependency updates and treat security advisories as bugs with deadlines.</p>
<blockquote><p>Security is not a feature you ship once. It is a habit your team practises every sprint.</p></blockquote>`,
  },
  {
    title: "Building a Recommendation Engine From Scratch",
    slug: "recommendation-engine-from-scratch",
    excerpt: "Collaborative filtering in plain Python, and the pitfalls that show up the moment real users arrive.",
    cover_image_url: img("1551288049-bebda4e38f71"),
    published_at: "2026-09-20T09:00:00Z",
    featured: false,
    views: 0,
    reading_time: 10,
    author: by("newsdesk"),
    category: cat("ai"),
    tags: tagged("machine-learning", "open-source"),
    content: `
<p>Recommendation engines power the feeds you scroll every day. The core idea behind many of them fits in a few dozen lines of code, and building one yourself is the best way to understand their strengths and failure modes.</p>
<h2>The idea</h2>
<p>Users who liked the same things in the past will probably like the same things in the future. That is collaborative filtering in one sentence.</p>
<h3>Measuring similarity</h3>
<pre><code class="language-python">import numpy as np

def cosine(a: np.ndarray, b: np.ndarray) -&gt; float:
    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b)))

def recommend(user, ratings, k=5):
    scores = {other: cosine(ratings[user], ratings[other])
              for other in ratings if other != user}
    return sorted(scores, key=scores.get, reverse=True)[:k]</code></pre>
<h2>The cold start problem</h2>
<p>New users and new items have no history, so similarity scores are meaningless. Content-based features such as categories, tags and descriptions bridge the gap until behaviour data accumulates.</p>
<h2>Evaluating results</h2>
<p>Offline metrics like precision at k are a starting point, but only online experiments tell you whether recommendations actually help people find what they want.</p>
<ul>
<li>Watch for popularity bias: the rich get richer.</li>
<li>Add diversity so feeds do not collapse into a single topic.</li>
<li>Explain recommendations where you can. Trust improves engagement.</li>
</ul>`,
  },
  {
    title: "Ten JavaScript Features You Are Probably Not Using Yet",
    slug: "javascript-features-not-using-yet",
    excerpt: "From structuredClone to Object.groupBy, small additions to the language that quietly remove a lot of boilerplate.",
    cover_image_url: img("1579468118864-1b9ea3c0db4a"),
    published_at: "2026-09-18T14:00:00Z",
    featured: false,
    views: 0,
    reading_time: 5,
    author: by("mujtaba"),
    category: cat("technology"),
    tags: tagged("javascript", "typescript"),
    content: `
<p>JavaScript keeps growing in small, useful ways. None of these features are revolutionary, but together they make everyday code shorter and clearer.</p>
<h2>Copying and grouping</h2>
<h3>structuredClone</h3>
<p>Deep-copy objects, maps, sets and dates without reaching for a library.</p>
<pre><code class="language-js">const original = { when: new Date(), tags: new Set(["a", "b"]) }
const copy = structuredClone(original)</code></pre>
<h3>Object.groupBy</h3>
<p>Group a list by key in one call instead of a hand-written reduce.</p>
<pre><code class="language-js">const byStatus = Object.groupBy(posts, (post) =&gt; post.status)
// { published: [...], draft: [...] }</code></pre>
<h2>Arrays without mutation</h2>
<p><code>toSorted</code>, <code>toReversed</code> and <code>with</code> return new arrays instead of changing the original. They are a perfect fit for React state.</p>
<h2>Smaller conveniences</h2>
<ul>
<li><code>Array.prototype.at(-1)</code> for the last item.</li>
<li><code>Promise.withResolvers()</code> for promises resolved elsewhere.</li>
<li><code>String.prototype.replaceAll</code>, no regex required.</li>
</ul>`,
  },
  {
    title: "Zero Trust Networking for Small Teams",
    slug: "zero-trust-for-small-teams",
    excerpt: "You do not need an enterprise budget to stop trusting your network. A pragmatic path for teams of five to fifty.",
    cover_image_url: img("1550751827-4bd374c3f58b"),
    published_at: "2026-09-16T08:00:00Z",
    featured: true,
    views: 0,
    reading_time: 7,
    author: by("kristen-elad"),
    category: cat("technology"),
    tags: tagged("security", "cloud"),
    content: `
<p>"Zero trust" has become a marketing phrase, but the idea behind it is sound: stop treating the office network or VPN as a safe zone. Verify every request based on who is asking and from what device.</p>
<h2>Why the VPN model breaks</h2>
<p>A traditional VPN gives anyone who connects broad access to internal systems. One phished laptop becomes a key to everything.</p>
<h2>A practical path</h2>
<ol>
<li><strong>Single sign-on everywhere.</strong> One identity provider, enforced multi-factor authentication.</li>
<li><strong>Device checks.</strong> Only managed, up-to-date devices reach sensitive tools.</li>
<li><strong>Per-app access.</strong> Put internal tools behind an identity-aware proxy instead of a network.</li>
<li><strong>Short-lived credentials.</strong> Replace long-lived keys with tokens that expire in hours.</li>
</ol>
<h3>Start with the crown jewels</h3>
<p>Protect production databases, cloud consoles and source control first. Everything else can follow.</p>
<blockquote><p>Zero trust is a direction, not a product. Every step you take reduces the blast radius of the next incident.</p></blockquote>`,
  },
  {
    title: "Running Open LLMs Locally: A Hands-On Guide",
    slug: "running-llms-locally",
    excerpt: "What hardware you need, which models are worth downloading, and how to wire a local model into your editor.",
    cover_image_url: img("1620712943543-bcc4688e7485"),
    published_at: "2026-09-14T11:00:00Z",
    featured: false,
    views: 0,
    reading_time: 8,
    author: by("mujtaba"),
    category: cat("ai"),
    tags: tagged("llms", "open-source"),
    content: `
<p>Open-weight models have become good enough for real work, and running them locally means your code never leaves your machine. Here is what it takes in practice.</p>
<h2>Hardware</h2>
<p>Memory is what matters most. A quantized 8-billion-parameter model runs comfortably in 16 GB of RAM. Larger models want a GPU with plenty of VRAM or a machine with unified memory.</p>
<h2>Getting started</h2>
<pre><code class="language-bash"># install a local model runner, then:
ollama pull llama3.1:8b
ollama run llama3.1:8b "Explain Rust lifetimes in two sentences"</code></pre>
<h3>Choosing a model</h3>
<ul>
<li><strong>Small (under 10B):</strong> fast autocomplete and simple chat.</li>
<li><strong>Medium (10–40B):</strong> solid coding help and summarization.</li>
<li><strong>Large (70B+):</strong> closest to hosted models, but hardware-hungry.</li>
</ul>
<h2>Connecting your editor</h2>
<p>Most local runners expose an OpenAI-compatible HTTP API, so any editor extension that lets you set a base URL will work.</p>
<p>Local models will not beat the best hosted models on hard problems, but for private code and offline work they are already very useful.</p>`,
  },
  {
    title: "TypeScript Patterns That Scale Beyond 100k Lines",
    slug: "typescript-patterns-that-scale",
    excerpt: "Branded types, discriminated unions and exhaustive checks: the patterns that keep large codebases honest.",
    cover_image_url: img("1461749280684-dccba630e2f6"),
    published_at: "2026-09-12T09:30:00Z",
    featured: false,
    views: 0,
    reading_time: 6,
    author: by("newsdesk"),
    category: cat("technology"),
    tags: tagged("typescript", "javascript"),
    content: `
<p>Small TypeScript projects get away with loose types. Large ones cannot. These patterns catch whole classes of bugs at compile time.</p>
<h2>Discriminated unions</h2>
<p>Model states explicitly instead of with optional fields that may or may not be set.</p>
<pre><code class="language-ts">type Request =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User[] }
  | { status: "error"; error: string }</code></pre>
<h3>Exhaustive checks</h3>
<pre><code class="language-ts">function assertNever(value: never): never {
  throw new Error(\`Unhandled case: \${JSON.stringify(value)}\`)
}</code></pre>
<p>Add a new status and the compiler points to every switch that needs updating.</p>
<h2>Branded types</h2>
<p>A <code>UserId</code> and an <code>OrderId</code> are both strings, but mixing them up is a bug. Brands make that bug a type error.</p>
<h2>Validate at the edges</h2>
<p>Types disappear at runtime. Parse external data with a schema library at the boundary, then trust your types everywhere inside.</p>`,
  },
  {
    title: "The Best Laptops for Coding in 2026",
    slug: "best-laptops-for-coding-2026",
    excerpt: "Battery life, keyboards, screens and thermals: we benchmarked the laptops developers actually buy.",
    cover_image_url: img("1496181133206-80ce9b88a853"),
    published_at: "2026-09-10T13:00:00Z",
    featured: false,
    views: 0,
    reading_time: 9,
    author: by("mujtaba"),
    category: cat("technology"),
    tags: tagged("reviews", "productivity"),
    content: `
<p>Compile times, container workloads and a dozen browser tabs will find the weak spot in any laptop. We ran the same development workload on every machine to see which ones hold up.</p>
<h2>How we tested</h2>
<ul>
<li>A full TypeScript monorepo build, cold and warm.</li>
<li>Four Docker containers running alongside an editor and browser.</li>
<li>Battery life during a typical coding day with the screen at 60% brightness.</li>
</ul>
<h2>Our picks</h2>
<h3>Best overall</h3>
<p>Excellent battery life, a superb screen and fast builds without fan noise. Pay for more memory rather than more storage.</p>
<h3>Best for Linux</h3>
<p>Great keyboard, good repairability and hardware that just works with mainstream distributions.</p>
<h3>Best value</h3>
<p>Last year's flagship at a steep discount. It is still faster than most developers need.</p>
<h2>What matters most</h2>
<p>32 GB of memory is the new sensible minimum for container-heavy work. After that, prioritise the keyboard and screen: you will spend thousands of hours with both.</p>`,
  },
  {
    title: "Bootstrapping a SaaS: Lessons From Year One",
    slug: "bootstrapping-a-saas-lessons",
    excerpt: "No funding, no team, and a product that finally pays the rent. What worked, what did not, and what we would do again.",
    cover_image_url: img("1519389950473-47ba0277781c"),
    published_at: "2026-09-08T10:00:00Z",
    featured: false,
    views: 0,
    reading_time: 7,
    author: by("kristen-elad"),
    category: cat("business"),
    tags: tagged("productivity", "cloud"),
    content: `
<p>A year ago this was a side project with three users. Today it pays for itself and then some. None of the lessons are secret, but most of them had to be learned the hard way.</p>
<h2>Charge from day one</h2>
<p>Free users give feedback on what they would use. Paying users give feedback on what they need. Only the second kind builds a business.</p>
<h2>Boring technology wins</h2>
<p>A single database, a single server-rendered app and a managed auth provider carried us to our first thousand customers. Every hour not spent on infrastructure went into the product.</p>
<h2>Talk to customers weekly</h2>
<ul>
<li>Schedule calls, do not wait for support tickets.</li>
<li>Ask what they did right before they needed your product.</li>
<li>Write down the exact words they use. Those words become your marketing.</li>
</ul>
<h2>What we would change</h2>
<p>We would raise prices sooner. Nobody churned when we did, and several customers said it made the product feel more trustworthy.</p>`,
  },
  {
    title: "Edge Computing, Explained for Web Developers",
    slug: "edge-computing-explained",
    excerpt: "What running code at the edge actually means, when it makes your app faster, and when it quietly makes it slower.",
    cover_image_url: img("1558494949-ef010cbdcc31"),
    published_at: "2026-09-05T09:00:00Z",
    featured: false,
    views: 0,
    reading_time: 6,
    author: by("newsdesk"),
    category: cat("technology"),
    tags: tagged("cloud", "javascript"),
    content: `
<p>"Deploy to the edge" sounds like a free speed-up. Sometimes it is. Sometimes it moves your code closer to users and further from your data, which makes everything slower.</p>
<h2>What the edge is</h2>
<p>Edge platforms run your code in data centres close to the visitor instead of in one central region. Latency for the first byte drops dramatically.</p>
<h2>When it helps</h2>
<ul>
<li>Redirects, rewrites and authentication checks.</li>
<li>Personalising cached pages with lightweight logic.</li>
<li>Serving responses that need no database at all.</li>
</ul>
<h2>When it hurts</h2>
<p>If a request needs three database queries and your database lives in one region, each query crosses an ocean. Keep data-heavy rendering close to the data.</p>
<blockquote><p>Move code to the edge when it does not need your database. Move data to the edge when it does.</p></blockquote>`,
  },
  {
    title: "Who Pays for Open Source? The State of Funding in 2026",
    slug: "open-source-funding-2026",
    excerpt: "Sponsorships, foundations and paid licences: how the maintainers behind critical infrastructure keep the lights on.",
    cover_image_url: img("1504639725590-34d0984388bd"),
    published_at: "2026-09-02T12:00:00Z",
    featured: false,
    views: 0,
    reading_time: 8,
    author: by("mujtaba"),
    category: cat("business"),
    tags: tagged("open-source"),
    content: `
<p>Modern software stands on open-source libraries maintained by surprisingly small groups of people. How those people get paid remains one of the industry's unsolved problems.</p>
<h2>The funding models</h2>
<h3>Sponsorships</h3>
<p>Individual and corporate sponsorships work well for popular, visible projects. They rarely reach the deep dependencies nobody thinks about.</p>
<h3>Foundations</h3>
<p>Foundations provide legal structure and pooled funding, but they favour large, established projects.</p>
<h3>Open core and dual licensing</h3>
<p>Selling hosted versions or enterprise features funds full-time teams, at the cost of occasional community friction.</p>
<h2>What companies can do</h2>
<ul>
<li>Audit your dependencies and fund the ones you rely on most.</li>
<li>Give engineers paid time to contribute upstream.</li>
<li>Report bugs with reproductions, not complaints.</li>
</ul>`,
  },
  {
    title: "Passkeys Are Finally Here. Should You Switch?",
    slug: "passkeys-are-here",
    excerpt: "How passkeys work, why they stop phishing cold, and how to roll them out without locking anyone out.",
    cover_image_url: img("1563986768609-322da13575f3"),
    published_at: "2026-08-29T09:00:00Z",
    featured: false,
    views: 0,
    reading_time: 6,
    author: by("newsdesk"),
    category: cat("technology"),
    tags: tagged("security", "productivity"),
    content: `
<p>Passwords are the weakest link in most security setups. Passkeys replace them with a cryptographic key pair that never leaves your device and cannot be phished.</p>
<h2>How passkeys work</h2>
<p>When you register, your device creates a key pair. The website stores the public key; the private key stays on your phone or laptop, protected by your fingerprint, face or PIN.</p>
<h3>Why phishing fails</h3>
<p>The key is bound to the real website's domain. A look-alike site simply cannot request it.</p>
<h2>Rolling them out</h2>
<ol>
<li>Offer passkeys as an option alongside passwords.</li>
<li>Prompt users to add one after a successful login.</li>
<li>Keep account recovery flows strong. They become the new attack surface.</li>
</ol>
<p>For most consumer apps, passkeys are ready today. Start by making them the easiest way to sign in.</p>`,
  },
]

export const posts: Post[] = seeds.map((seed, i) => ({
  ...seed,
  id: `p${i + 1}`,
  status: "published",
  meta_title: null,
  meta_description: null,
}))

