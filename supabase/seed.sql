-- Role → permission map. Edit here, not in the app: the JWT hook reads this table.
insert into public.role_permissions (role, permission) values
  ('admin',   'users.read'),
  ('admin',   'users.invite'),
  ('admin',   'users.update'),
  ('admin',   'users.disable'),
  ('admin',   'roles.read'),
  ('admin',   'roles.assign'),
  ('admin',   'audit.read'),
  ('admin',   'blog.read'),
  ('admin',   'blog.write'),
  ('admin',   'blog.publish'),

  ('manager', 'users.read'),
  ('manager', 'users.invite'),
  ('manager', 'users.update'),
  ('manager', 'roles.read'),
  ('manager', 'blog.read'),
  ('manager', 'blog.write'),
  ('manager', 'blog.publish'),

  ('support', 'users.read'),
  ('support', 'roles.read'),
  ('support', 'blog.read')
  -- 'member' intentionally has no permissions: it is the default authenticated user.
on conflict (role, permission) do nothing;

-- Bootstrapping the first admin
-- ------------------------------
-- Roles are service_role-only, so the first grant cannot come from the app. After
-- creating your account, run (locally, or from the Supabase SQL editor):
--
--   insert into public.user_roles (user_id, role)
--   select id, 'admin' from auth.users where email = 'you@example.com'
--   on conflict do nothing;
--
-- Then sign out and back in — permissions arrive in the JWT at token issue time.

-- Sample blog posts
-- -----------------
-- Two published articles and one draft, so /blog renders something on a fresh
-- `supabase db reset` and the authoring screen has a draft to open. author_id is
-- null: there is no user yet at seed time, and the column is nullable for exactly
-- that reason. Delete this block once you have real content.
insert into public.blog_posts (slug, title, excerpt, content, tags, status, published_at) values
  (
    'hello-world',
    'Hello world',
    'Why this starter exists, and what it gives you on day one.',
    E'## Why another starter\n\nMost starters hand you a login form and stop. This one hands you the parts that are tedious to get right: role-based access control with permissions in the JWT, row level security that is actually enforced, an admin back-office, error and docs shells, runtime i18n, and a Docker build per app.\n\n## What is inside\n\n- **Nx monorepo** — three apps and around seventy libraries, with module boundaries enforced by lint rules.\n- **Supabase-first** — the browser talks to Postgres under RLS; the API only does work that needs a secret.\n- **spartan/ui** — vendored components you own, styled with Tailwind v4 tokens.\n\nRead the architecture document for the full model.',
    array['starter', 'nx', 'angular'],
    'published',
    now() - interval '14 days'
  ),
  (
    'row-level-security-in-practice',
    'Row level security in practice',
    'Policies are the security boundary. The Angular guards are not.',
    E'## The rule\n\nEvery table in this workspace enables RLS, and every policy is written as if the client were hostile — because it is. `permissionGuard` and `*libHasPermission` decide what renders; they decide nothing about what a request is allowed to return.\n\n## Reading claims instead of joining\n\nA custom access token hook stamps roles and permissions into the JWT at issue time, so `authorize()` reads the token rather than joining `user_roles` on every row. That keeps policies cheap enough to put on hot paths.\n\n```sql\ncreate policy blog_posts_select_published on public.blog_posts\n  for select to anon, authenticated\n  using (status = ''published'' and published_at <= now());\n```\n\n## The cost\n\nClaims are only as fresh as the token. A revoked permission survives until the next refresh, which is why disabling a user also signs them out globally.',
    array['supabase', 'security', 'postgres'],
    'published',
    now() - interval '3 days'
  ),
  (
    'what-ships-next',
    'What ships next',
    'A look at the roadmap: billing, storage, and a search page.',
    E'## Draft\n\nThis post is unpublished on purpose — it is what the authoring screen opens with, and it is invisible to `/blog` because the public policy filters on `status = ''published''`.',
    array['roadmap'],
    'draft',
    null
  )
on conflict (slug) do nothing;
