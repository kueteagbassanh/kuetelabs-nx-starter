-- Blog posts.
--
-- Reading is public: anonymous visitors see published posts through RLS, which is
-- what lets `web` render /blog on the server with the anon key and nothing else.
-- Drafts are visible only to holders of blog.read.
--
-- Writing has no client policy at all — the same rule as user_roles and
-- notifications. Authoring goes through the NestJS API (libs/backend/blog) with the
-- service_role key, which re-checks blog.write / blog.publish on the verified JWT.
-- A browser therefore cannot publish, however the UI is manipulated.

create type public.blog_post_status as enum ('draft', 'published', 'archived');

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  -- The URL segment. Lower-case, hyphen-separated; the check is what keeps
  -- /blog/:slug from ever needing encoding.
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 1 and 120),
  title text not null check (char_length(title) between 1 and 200),
  excerpt text check (char_length(excerpt) <= 400),
  -- Markdown. Rendered client-side; never inserted as raw HTML.
  content text not null check (char_length(content) between 1 and 100000),
  -- Reading time, derived here rather than in the app so the feed can label a card
  -- without selecting the article body. 200 words per minute, never zero.
  reading_minutes integer not null generated always as (
    greatest(
      1,
      ceil(array_length(regexp_split_to_array(trim(content), '\s+'), 1)::numeric / 200)::integer
    )
  ) stored,
  cover_image_url text check (cover_image_url is null or cover_image_url ~ '^https?://'),
  -- Flat tags rather than a tags table plus a join table: a post carries a handful
  -- of labels with no attributes of their own, and a GIN index makes `tags @> ...`
  -- as fast as the join would have been.
  tags text[] not null default '{}'::text[],
  status public.blog_post_status not null default 'draft',
  author_id uuid references auth.users (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A published post always has a date; the trigger below fills it, so this only
  -- fires if something bypasses it.
  constraint blog_posts_published_has_date
    check (status <> 'published' or published_at is not null)
);

comment on table public.blog_posts is
  'Blog articles. Publicly readable once published; written only by the API with service_role.';

-- The list query is "published posts, newest first" — a partial index so drafts
-- and archived rows cost nothing.
create index blog_posts_published_idx
  on public.blog_posts (published_at desc)
  where status = 'published';

-- The authoring list is "everything, most recently touched first".
create index blog_posts_updated_idx on public.blog_posts (updated_at desc);

create index blog_posts_tags_idx on public.blog_posts using gin (tags);

-- Indexed because RLS and the author filter both touch it, and it is a foreign key.
create index blog_posts_author_idx on public.blog_posts (author_id);

-- Full-text search over the post. A generated column rather than an expression
-- index so the frontend can `.textSearch('search_vector', ...)` by name.
alter table public.blog_posts
  add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored;

create index blog_posts_search_idx on public.blog_posts using gin (search_vector);

-- ---------------------------------------------------------------- triggers

create trigger blog_posts_touch_updated_at
  before update on public.blog_posts
  for each row execute function public.touch_updated_at();

-- Publishing stamps the date once. Re-publishing an archived post keeps the
-- original date, so a permalink's "published on" never moves under a reader.
create or replace function public.blog_posts_stamp_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

create trigger blog_posts_stamp_published_at
  before insert or update on public.blog_posts
  for each row execute function public.blog_posts_stamp_published_at();

-- ---------------------------------------------------------------- RLS

alter table public.blog_posts enable row level security;

-- Privileges and policies are two different gates, and a policy grants nothing on
-- its own: without this, every client read fails with "permission denied for table
-- blog_posts" before any policy is consulted. The Supabase CLI does not hand these
-- out by default.
--
-- SELECT only, and never for the write verbs — the API holds service_role for those,
-- so even a policy added here by mistake could not turn into a client write.
grant select on public.blog_posts to anon, authenticated;

-- The public feed. `anon` is included on purpose: the marketing site renders it
-- for logged-out visitors, and SSR uses the anon key too.
--
-- published_at <= now() means a future date is a scheduled post: the row exists
-- and is 'published', but no reader can see it until the clock passes it.
create policy blog_posts_select_published on public.blog_posts
  for select to anon, authenticated
  using (status = 'published' and published_at <= now());

-- Editors see everything, including drafts and scheduled posts.
create policy blog_posts_select_authoring on public.blog_posts
  for select to authenticated
  using ((select public.authorize('blog.read')));

-- Authors always see their own drafts, even without blog.read.
create policy blog_posts_select_own on public.blog_posts
  for select to authenticated
  using ((select auth.uid()) = author_id);

-- No insert/update/delete policy: authoring is service_role work in the API.
