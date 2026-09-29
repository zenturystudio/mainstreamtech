-- Comments were removed from the site. Drops the table (with its policies,
-- indexes and throttle trigger) and the now-unused throttle function.
drop table if exists public.comments cascade;
drop function if exists public.throttle_comments();
