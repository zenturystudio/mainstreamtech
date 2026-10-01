-- Clomark receiver (/api/content): track where each post came from, and a
-- small rate-limit table shared by all serverless instances.

-- 1. Post source -------------------------------------------------------------
-- manual    = written in the CMS (default)
-- wordpress = imported from the old WordPress site
-- clomark   = sent by the Clomark content engine; only these may be overwritten by it
alter table public.posts
  add column source text not null default 'manual'
    constraint posts_source_check check (source in ('manual', 'wordpress', 'clomark')),
  add column source_meta jsonb;

create index posts_source_idx on public.posts (source) where source <> 'manual';

-- Signed-in CMS users can never set or change the source (so nobody can mark a
-- hand-written post as "clomark" and expose it to overwrites). Only the
-- service role (auth.uid() is null: the API route, scripts) can.
create or replace function public.protect_post_source()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null then
    if tg_op = 'INSERT' then
      new.source := 'manual';
      new.source_meta := null;
    else
      new.source := old.source;
      new.source_meta := old.source_meta;
    end if;
  end if;
  return new;
end;
$$;

create trigger posts_protect_source
  before insert or update on public.posts
  for each row execute function public.protect_post_source();

-- 2. API rate limiting -------------------------------------------------------
create table public.api_rate_limits (
  bucket       text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (bucket, window_start)
);

-- RLS on with no policies: only the service role can touch it.
alter table public.api_rate_limits enable row level security;
revoke all on table public.api_rate_limits from anon, authenticated;

-- Counts one hit in the current fixed window; true while within the limit.
create or replace function public.api_rate_limit_hit(p_bucket text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_hits integer;
begin
  insert into public.api_rate_limits as r (bucket, window_start, hits)
  values (p_bucket, v_window, 1)
  on conflict (bucket, window_start) do update set hits = r.hits + 1
  returning hits into v_hits;

  -- Occasional cleanup of old windows.
  if random() < 0.02 then
    delete from public.api_rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke all on function public.api_rate_limit_hit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.api_rate_limit_hit(text, integer, integer) to service_role;
