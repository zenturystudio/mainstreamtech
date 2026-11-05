-- posts.updated_at should mean "the story was edited". The shared trigger bumped
-- it on every write, including the view counter (views = views + 1 on each
-- read) and the Featured toggle, so every story looked freshly modified in the
-- sitemap and in dateModified. Only bump it when something other than these
-- bookkeeping columns changes. An explicit updated_at in the update is kept.
create or replace function public.posts_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  if (to_jsonb(new) - 'views' - 'featured' - 'updated_at' - 'search_vector')
     is distinct from
     (to_jsonb(old) - 'views' - 'featured' - 'updated_at' - 'search_vector') then
    new.updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.posts_set_updated_at();

-- One-time clean-up: dates polluted by view counts. Stories published before
-- November 2026 had no real edits since import, so their modified date is their
-- publish date. (The new trigger keeps an explicitly set updated_at.)
update public.posts
  set updated_at = published_at
  where published_at is not null and published_at < '2026-11-01';
