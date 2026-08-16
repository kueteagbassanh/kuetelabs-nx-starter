# blog-data-access

State for the blog. Two stores, because reading and writing take different paths.

- **`BlogStore`** — the public feed. Reads published posts straight from Supabase under RLS, which
  is what lets `web` server-render `/blog` with nothing but the anon key.
- **`BlogAdminStore` / `BlogAdminApi`** — authoring. Every mutation goes through the NestJS API:
  `blog_posts` has no client write policy, and the permission that decides whether a post may be
  published is checked against the JWT on the server. Needs `BLOG_API_URL` provided.

Two things here are load-bearing:

- **The public feed repeats the `status = 'published'` filter in the query.** RLS has a second,
  broader policy for holders of `blog.read`, and Postgres OR-es policies — without the explicit
  filter, a signed-in editor sees drafts on the public site.
- **Each query is wrapped in a `PendingTasks` task.** supabase-js uses its own `fetch` and registers
  nothing with Angular, so this is what makes the SSR render wait for the rows instead of
  serializing an empty feed.

Both stores degrade to an empty feed when Supabase is not configured, so a fresh clone can still
open `/blog`.
