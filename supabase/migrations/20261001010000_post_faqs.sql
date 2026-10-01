-- Per-story FAQs, rendered at the end of the story and as FAQPage schema.
-- Shape: [{ "question": "...", "answer": "..." }, ...] (plain text).
alter table public.posts
  add column faqs jsonb not null default '[]'::jsonb
  constraint posts_faqs_is_array check (jsonb_typeof(faqs) = 'array');
