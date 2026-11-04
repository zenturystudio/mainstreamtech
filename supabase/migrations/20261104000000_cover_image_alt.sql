-- Alt text for a post's featured (cover) image. Null = fall back to the post title.
alter table public.posts add column if not exists cover_image_alt text;
