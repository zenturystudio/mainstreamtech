-- =============================================================================
-- Seed data: 3 categories, 5 tags, 6 published posts.
-- Posts are attributed to the first admin (or, failing that, the first user),
-- so create your account BEFORE running this file.
-- =============================================================================

do $$
declare
  seed_author uuid;
  cat_dev uuid; cat_ai uuid; cat_gadgets uuid;
  tag_js uuid; tag_react uuid; tag_ml uuid; tag_security uuid; tag_reviews uuid;
  p1 uuid; p2 uuid; p3 uuid; p4 uuid; p5 uuid; p6 uuid;
begin
  select id into seed_author from public.profiles
  order by (role = 'admin') desc, created_at asc
  limit 1;

  if seed_author is null then
    raise exception 'No profiles found. Sign up a user first, then run seed.sql.';
  end if;

  -- Categories
  insert into public.categories (name, slug, description) values
    ('Development', 'development', 'Tutorials and deep dives for software engineers.')
    returning id into cat_dev;
  insert into public.categories (name, slug, description) values
    ('Artificial Intelligence', 'artificial-intelligence', 'Machine learning, LLMs and the tools built on them.')
    returning id into cat_ai;
  insert into public.categories (name, slug, description) values
    ('Gadgets', 'gadgets', 'Hands-on reviews of the hardware worth your money.')
    returning id into cat_gadgets;

  -- Tags
  insert into public.tags (name, slug) values ('JavaScript', 'javascript') returning id into tag_js;
  insert into public.tags (name, slug) values ('React', 'react') returning id into tag_react;
  insert into public.tags (name, slug) values ('Machine Learning', 'machine-learning') returning id into tag_ml;
  insert into public.tags (name, slug) values ('Security', 'security') returning id into tag_security;
  insert into public.tags (name, slug) values ('Reviews', 'reviews') returning id into tag_reviews;

  -- Posts
  insert into public.posts (title, slug, excerpt, content, cover_image_url, status, published_at, author_id, category_id, featured, views, reading_time, meta_description)
  values (
    'Server Components, Explained Without the Hype',
    'server-components-explained',
    'What React Server Components actually change about how you build apps, and where they still fall short.',
    '<h2>Why Server Components exist</h2><p>For years, React apps shipped every component to the browser, even the ones that only ever rendered static markup. Server Components flip that default: components run on the server unless you opt into the client.</p><h3>The mental model</h3><p>Think of the server tree as a document that streams in, with interactive islands marked by <code>"use client"</code>.</p><pre><code class="language-tsx">export default async function Page() {
  const posts = await getPosts()
  return &lt;PostList posts={posts} /&gt;
}</code></pre><h2>Where they fall short</h2><p>Anything that needs state, effects or browser APIs still belongs on the client. The boundary is explicit, which is a feature and a source of friction.</p><blockquote><p>Default to the server, reach for the client when you need interaction.</p></blockquote>',
    'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1600&q=80',
    'published', now() - interval '2 days', seed_author, cat_dev, true, 1240, 4,
    'A practical explanation of React Server Components and when to use them.'
  ) returning id into p1;

  insert into public.posts (title, slug, excerpt, content, cover_image_url, status, published_at, author_id, category_id, featured, views, reading_time)
  values (
    'Ten JavaScript Features You Are Probably Not Using Yet',
    'javascript-features-not-using-yet',
    'From structuredClone to Array.prototype.at, small additions that clean up everyday code.',
    '<h2>Built-ins worth knowing</h2><p>The language keeps growing in small, useful ways. Here are the additions that remove the most boilerplate.</p><h3>structuredClone</h3><p>Deep-copy objects, maps, sets and dates without reaching for a library.</p><pre><code class="language-js">const copy = structuredClone(original)</code></pre><h3>Array.prototype.at</h3><p>Negative indexing without <code>arr[arr.length - 1]</code>.</p><h3>Object.groupBy</h3><p>Group a list by key in one call.</p><h2>Wrapping up</h2><p>None of these are revolutionary, but together they make code shorter and clearer.</p>',
    'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=1600&q=80',
    'published', now() - interval '5 days', seed_author, cat_dev, false, 860, 3
  ) returning id into p2;

  insert into public.posts (title, slug, excerpt, content, cover_image_url, status, published_at, author_id, category_id, featured, views, reading_time)
  values (
    'How Large Language Models Actually Work',
    'how-large-language-models-work',
    'Tokens, attention and next-token prediction, explained for developers who want the real picture.',
    '<h2>Everything is a token</h2><p>Text is split into tokens, and each token maps to a vector. The model never sees letters, only these numeric representations.</p><h2>Attention</h2><p>Attention lets every token weigh every other token when building its representation. That is how a model tracks context across a long passage.</p><h3>Next-token prediction</h3><p>Training boils down to predicting the next token, billions of times. Capabilities emerge from scale and data, not from hand-written rules.</p><h2>What this means for you</h2><p>Understanding the mechanics helps you write better prompts and set realistic expectations.</p>',
    'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600&q=80',
    'published', now() - interval '8 days', seed_author, cat_ai, true, 2310, 5
  ) returning id into p3;

  insert into public.posts (title, slug, excerpt, content, cover_image_url, status, published_at, author_id, category_id, featured, views, reading_time)
  values (
    'Securing Your Web App: A Practical Checklist',
    'web-app-security-checklist',
    'The handful of protections that stop most real-world attacks, from CSP to row level security.',
    '<h2>Start with the basics</h2><ul><li>Use HTTPS everywhere.</li><li>Hash passwords with a modern algorithm.</li><li>Validate input on the server, always.</li></ul><h2>Defence in depth</h2><p>Row level security in your database means a bug in your API cannot leak another user''s data.</p><h3>Content Security Policy</h3><p>A strict CSP turns many XSS bugs into harmless console errors.</p><h2>Keep dependencies patched</h2><p>Most breaches exploit known vulnerabilities. Automate updates.</p>',
    'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1600&q=80',
    'published', now() - interval '12 days', seed_author, cat_dev, false, 540, 4
  ) returning id into p4;

  insert into public.posts (title, slug, excerpt, content, cover_image_url, status, published_at, author_id, category_id, featured, views, reading_time)
  values (
    'Building a Recommendation Engine From Scratch',
    'recommendation-engine-from-scratch',
    'Collaborative filtering in plain Python, and the pitfalls that show up once real users arrive.',
    '<h2>The idea</h2><p>Users who liked the same things in the past will probably like the same things in the future.</p><h3>Similarity</h3><pre><code class="language-python">def cosine(a, b):
    return dot(a, b) / (norm(a) * norm(b))</code></pre><h2>Cold start</h2><p>New users and new items have no history. Content-based features bridge the gap.</p><h2>Evaluation</h2><p>Offline metrics are a start, but only A/B tests tell you whether recommendations help.</p>',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1600&q=80',
    'published', now() - interval '16 days', seed_author, cat_ai, false, 710, 6
  ) returning id into p5;

  insert into public.posts (title, slug, excerpt, content, cover_image_url, status, published_at, author_id, category_id, featured, views, reading_time)
  values (
    'The Best Mechanical Keyboards for Developers',
    'best-mechanical-keyboards-developers',
    'We typed on a dozen boards for a month. These are the ones we would buy again.',
    '<h2>What we looked for</h2><p>Build quality, switch feel, layout options and software that does not get in the way.</p><h2>Our picks</h2><h3>Best overall</h3><p>A solid aluminium 75% board with hot-swap sockets and quiet tactile switches.</p><h3>Best budget</h3><p>Plastic case, great stock keycaps, and a price that leaves room for upgrades.</p><h2>The verdict</h2><p>Buy for layout first, switches second. Everything else can be changed later.</p>',
    'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1600&q=80',
    'published', now() - interval '20 days', seed_author, cat_gadgets, false, 1580, 3
  ) returning id into p6;

  -- Post ↔ tag links
  insert into public.post_tags (post_id, tag_id) values
    (p1, tag_react), (p1, tag_js),
    (p2, tag_js),
    (p3, tag_ml),
    (p4, tag_security), (p4, tag_js),
    (p5, tag_ml),
    (p6, tag_reviews);

end $$;
