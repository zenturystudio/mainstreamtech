-- =============================================================================
-- Visitor analytics: one row per story read, with an anonymous visitor id.
-- Rows are only written through track_post_view(); nobody can insert directly.
-- =============================================================================

create table public.post_views (
  id         bigint generated always as identity primary key,
  post_id    uuid not null references public.posts (id) on delete cascade,
  -- Random id generated in the reader's browser; no personal data.
  visitor_id text not null check (char_length(visitor_id) between 8 and 64),
  -- Host of the referring site only (e.g. "google.com"), null for direct visits.
  referrer   text check (referrer is null or char_length(referrer) <= 255),
  viewed_at  timestamptz not null default now()
);

create index post_views_viewed_at_idx on public.post_views (viewed_at desc);
create index post_views_post_idx on public.post_views (post_id, viewed_at desc);
create index post_views_visitor_idx on public.post_views (visitor_id, post_id, viewed_at desc);

alter table public.post_views enable row level security;

create policy "Admins read all views"
  on public.post_views for select to authenticated
  using (public.is_admin());

create policy "Authors read views of own posts"
  on public.post_views for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

-- No insert/update/delete policies: writes happen only in track_post_view().

-- Records a read and bumps the story's running total. Repeat reads of the
-- same story by the same visitor within 30 minutes are ignored.
create or replace function public.track_post_view(post_slug text, visitor text, referrer_host text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if visitor is null or char_length(visitor) not between 8 and 64 then
    return;
  end if;

  select id into target from public.posts
  where slug = post_slug
    and status in ('published', 'scheduled')
    and published_at <= now();
  if target is null then
    return;
  end if;

  if exists (
    select 1 from public.post_views
    where post_id = target and visitor_id = visitor and viewed_at > now() - interval '30 minutes'
  ) then
    return;
  end if;

  insert into public.post_views (post_id, visitor_id, referrer)
  values (target, visitor, nullif(left(lower(trim(referrer_host)), 255), ''));

  update public.posts set views = views + 1 where id = target;
end;
$$;

grant execute on function public.track_post_view(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reporting (SECURITY INVOKER: RLS decides which rows each user can see)
-- Days are counted in UK time.
-- ---------------------------------------------------------------------------

create or replace function public.visitor_daily(from_ts timestamptz, to_ts timestamptz)
returns table (day date, views bigint, visitors bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select (v.viewed_at at time zone 'Europe/London')::date as day,
         count(*) as views,
         count(distinct v.visitor_id) as visitors
  from public.post_views v
  where v.viewed_at >= from_ts and v.viewed_at < to_ts
  group by 1
  order by 1;
$$;

create or replace function public.visitor_totals(from_ts timestamptz, to_ts timestamptz)
returns table (views bigint, visitors bigint, stories bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*), count(distinct v.visitor_id), count(distinct v.post_id)
  from public.post_views v
  where v.viewed_at >= from_ts and v.viewed_at < to_ts;
$$;

create or replace function public.visitor_top_posts(from_ts timestamptz, to_ts timestamptz, max_rows integer default 10)
returns table (post_id uuid, title text, slug text, views bigint, visitors bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select v.post_id, p.title, p.slug, count(*) as views, count(distinct v.visitor_id) as visitors
  from public.post_views v
  join public.posts p on p.id = v.post_id
  where v.viewed_at >= from_ts and v.viewed_at < to_ts
  group by v.post_id, p.title, p.slug
  order by views desc, visitors desc
  limit max_rows;
$$;

create or replace function public.visitor_referrers(from_ts timestamptz, to_ts timestamptz, max_rows integer default 8)
returns table (referrer text, views bigint, visitors bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(v.referrer, 'Direct') as referrer, count(*) as views, count(distinct v.visitor_id) as visitors
  from public.post_views v
  where v.viewed_at >= from_ts and v.viewed_at < to_ts
  group by 1
  order by views desc
  limit max_rows;
$$;
