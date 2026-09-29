-- =============================================================================
-- MainstreamTech blog + CMS — core schema
-- Tables, indexes, triggers, functions, RLS policies and storage.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Generic helpers
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  username    text unique check (username ~ '^[a-z0-9_-]{3,32}$'),
  avatar_url  text,
  bio         text,
  role        text not null default 'author' check (role in ('admin', 'author')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- SECURITY DEFINER so RLS policies can call it (including on profiles itself)
-- without recursing into profiles' own policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Create a profile for every new auth user. Username is derived from metadata
-- or the email local part, with a random suffix if already taken.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base_username text;
  final_username text;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    '[^a-zA-Z0-9_-]', '', 'g'
  ));
  if length(base_username) < 3 then
    base_username := 'user' || base_username;
  end if;
  base_username := left(base_username, 24);

  final_username := base_username;
  while exists (select 1 from public.profiles where username = final_username) loop
    final_username := base_username || '-' || substr(md5(random()::text), 1, 6);
  end loop;

  insert into public.profiles (id, full_name, username, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    final_username,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS cannot compare OLD vs NEW, so role changes are guarded by a trigger.
-- auth.uid() is null for the SQL editor / service role, which lets you
-- promote the first admin manually.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only admins can change roles' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- categories & tags
-- -----------------------------------------------------------------------------

create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  created_at  timestamptz not null default now()
);

create table public.tags (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  slug       text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- posts
-- -----------------------------------------------------------------------------

create table public.posts (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (char_length(title) between 1 and 200),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  excerpt          text,
  content          text not null default '',
  cover_image_url  text,
  status           text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  published_at     timestamptz,
  author_id        uuid references public.profiles (id) on delete set null,
  -- restrict: the CMS must reassign posts before a category can be deleted
  category_id      uuid references public.categories (id) on delete restrict,
  featured         boolean not null default false,
  views            integer not null default 0 check (views >= 0),
  reading_time     integer not null default 1 check (reading_time >= 1),
  meta_title       text,
  meta_description text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  search_vector    tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', regexp_replace(coalesce(content, ''), '<[^>]+>', ' ', 'g')), 'C')
  ) stored,
  constraint scheduled_needs_date check (status <> 'scheduled' or published_at is not null)
);

create index posts_search_idx      on public.posts using gin (search_vector);
create index posts_public_feed_idx on public.posts (published_at desc) where status in ('published', 'scheduled');
create index posts_author_idx      on public.posts (author_id);
create index posts_category_idx    on public.posts (category_id);
create index posts_views_idx       on public.posts (views desc);
create index posts_featured_idx    on public.posts (published_at desc) where featured;

-- Stamp published_at the first time a post goes live without an explicit date.
create or replace function public.set_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger posts_set_published_at
  before insert or update on public.posts
  for each row execute function public.set_published_at();

create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- post_tags
-- -----------------------------------------------------------------------------

create table public.post_tags (
  post_id uuid not null references public.posts (id) on delete cascade,
  tag_id  uuid not null references public.tags (id) on delete cascade,
  primary key (post_id, tag_id)
);

create index post_tags_tag_idx on public.post_tags (tag_id);

-- -----------------------------------------------------------------------------
-- comments
-- -----------------------------------------------------------------------------

create table public.comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts (id) on delete cascade,
  parent_id    uuid references public.comments (id) on delete cascade,
  author_name  text not null check (char_length(author_name) between 1 and 80),
  author_email text not null check (author_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  content      text not null check (char_length(content) between 1 and 5000),
  status       text not null default 'pending' check (status in ('pending', 'approved', 'spam')),
  created_at   timestamptz not null default now()
);

create index comments_post_status_idx on public.comments (post_id, status, created_at);
create index comments_status_idx      on public.comments (status, created_at desc);
create index comments_parent_idx      on public.comments (parent_id);

-- Basic DB-level flood protection on top of the app's honeypot:
-- max 3 comments per email per minute (admins exempt).
create or replace function public.throttle_comments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() and (
    select count(*) from public.comments
    where lower(author_email) = lower(new.author_email)
      and created_at > now() - interval '1 minute'
  ) >= 3 then
    raise exception 'Too many comments, please wait a minute' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

create trigger comments_throttle
  before insert on public.comments
  for each row execute function public.throttle_comments();

-- -----------------------------------------------------------------------------
-- newsletter_subscribers
-- -----------------------------------------------------------------------------

create table public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- site_settings (single row, enforced by id = 1)
-- -----------------------------------------------------------------------------

create table public.site_settings (
  id               integer primary key default 1 check (id = 1),
  site_name        text not null default 'MainstreamTech',
  site_description text default 'News, guides and deep dives on technology.',
  logo_url         text,
  social_links     jsonb not null default '{}'::jsonb,
  posts_per_page   integer not null default 9 check (posts_per_page between 1 and 50),
  updated_at       timestamptz not null default now()
);

insert into public.site_settings (id) values (1);

create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- RPC functions
-- -----------------------------------------------------------------------------

-- Runs as definer so anonymous readers can bump the counter without having
-- UPDATE rights on posts. Only affects posts that are publicly visible.
create or replace function public.increment_post_views(post_slug text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.posts
  set views = views + 1
  where slug = post_slug
    and status in ('published', 'scheduled')
    and published_at <= now();
$$;

-- Full-text search. SECURITY INVOKER so RLS still limits results to what the
-- caller may see. Returns highlighted snippets and a total count for paging.
create or replace function public.search_posts(
  search_query text,
  page_limit   integer default 10,
  page_offset  integer default 0
)
returns table (
  id              uuid,
  title           text,
  slug            text,
  excerpt         text,
  cover_image_url text,
  published_at    timestamptz,
  reading_time    integer,
  author_id       uuid,
  category_id     uuid,
  rank            real,
  headline        text,
  total_count     bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (select websearch_to_tsquery('english', search_query) as query)
  select
    p.id, p.title, p.slug, p.excerpt, p.cover_image_url, p.published_at,
    p.reading_time, p.author_id, p.category_id,
    ts_rank(p.search_vector, q.query) as rank,
    ts_headline(
      'english',
      coalesce(p.excerpt, '') || ' ' || regexp_replace(p.content, '<[^>]+>', ' ', 'g'),
      q.query,
      'StartSel=<mark>, StopSel=</mark>, MaxWords=35, MinWords=15, MaxFragments=2'
    ) as headline,
    count(*) over () as total_count
  from public.posts p, q
  where p.search_vector @@ q.query
    and p.status in ('published', 'scheduled')
    and p.published_at <= now()
  order by rank desc, p.published_at desc
  limit page_limit offset page_offset;
$$;

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.profiles               enable row level security;
alter table public.categories             enable row level security;
alter table public.tags                   enable row level security;
alter table public.posts                  enable row level security;
alter table public.post_tags              enable row level security;
alter table public.comments               enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.site_settings          enable row level security;

-- profiles -------------------------------------------------------------------
create policy "Profiles are public"
  on public.profiles for select using (true);

create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

create policy "Admins update any profile"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- categories -----------------------------------------------------------------
create policy "Categories are public"
  on public.categories for select using (true);

create policy "Admins manage categories"
  on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- tags -----------------------------------------------------------------------
create policy "Tags are public"
  on public.tags for select using (true);

create policy "Admins manage tags"
  on public.tags for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Authors need to create tags on the fly from the post editor.
create policy "Authors create tags"
  on public.tags for insert to authenticated
  with check (auth.uid() is not null);

-- posts ----------------------------------------------------------------------
-- 'scheduled' posts become visible automatically once published_at passes.
create policy "Published posts are public"
  on public.posts for select
  using (status in ('published', 'scheduled') and published_at <= now());

create policy "Authors read own posts"
  on public.posts for select to authenticated
  using (author_id = auth.uid());

create policy "Authors create own posts"
  on public.posts for insert to authenticated
  with check (author_id = auth.uid());

create policy "Authors update own posts"
  on public.posts for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "Authors delete own posts"
  on public.posts for delete to authenticated
  using (author_id = auth.uid());

create policy "Admins manage all posts"
  on public.posts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- post_tags ------------------------------------------------------------------
create policy "Post tags are public"
  on public.post_tags for select using (true);

create policy "Owners and admins manage post tags"
  on public.post_tags for all to authenticated
  using (
    public.is_admin() or exists (
      select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()
    )
  )
  with check (
    public.is_admin() or exists (
      select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()
    )
  );

-- comments -------------------------------------------------------------------
create policy "Approved comments are public"
  on public.comments for select using (status = 'approved');

create policy "Authors read comments on own posts"
  on public.comments for select to authenticated
  using (exists (
    select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()
  ));

-- Anyone may comment on a live post, but only as 'pending'.
create policy "Anyone can submit a pending comment"
  on public.comments for insert
  with check (
    status = 'pending'
    and exists (
      select 1 from public.posts p
      where p.id = post_id
        and p.status in ('published', 'scheduled')
        and p.published_at <= now()
    )
  );

create policy "Admins manage comments"
  on public.comments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Never expose commenter emails to anonymous readers. Anon queries must list
-- columns explicitly (no select *), and inserts must not use .select().
revoke select on public.comments from anon;
grant select (id, post_id, parent_id, author_name, content, status, created_at)
  on public.comments to anon;

-- newsletter_subscribers -----------------------------------------------------
create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert with check (true);

create policy "Admins read subscribers"
  on public.newsletter_subscribers for select to authenticated
  using (public.is_admin());

create policy "Admins delete subscribers"
  on public.newsletter_subscribers for delete to authenticated
  using (public.is_admin());

-- site_settings --------------------------------------------------------------
create policy "Settings are public"
  on public.site_settings for select using (true);

create policy "Admins update settings"
  on public.site_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- =============================================================================
-- Storage: blog-images bucket
-- Files are stored as {user_id}/{timestamp}-{filename}
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'blog-images',
  'blog-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do nothing;

-- Public bucket: objects are served by URL without a policy. This SELECT
-- policy is for listing files in the CMS media library.
create policy "Authenticated users list blog images"
  on storage.objects for select to authenticated
  using (bucket_id = 'blog-images');

create policy "Users upload to own folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'blog-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own images"
  on storage.objects for update to authenticated
  using (bucket_id = 'blog-images' and owner_id = auth.uid()::text)
  with check (bucket_id = 'blog-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own images, admins delete any"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'blog-images'
    and (owner_id = auth.uid()::text or public.is_admin())
  );
