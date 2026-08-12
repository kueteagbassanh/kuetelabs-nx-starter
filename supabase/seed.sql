-- Role → permission map. Edit here, not in the app: the JWT hook reads this table.
insert into public.role_permissions (role, permission) values
  ('admin',   'users.read'),
  ('admin',   'users.invite'),
  ('admin',   'users.update'),
  ('admin',   'users.disable'),
  ('admin',   'roles.read'),
  ('admin',   'roles.assign'),
  ('admin',   'audit.read'),

  ('manager', 'users.read'),
  ('manager', 'users.invite'),
  ('manager', 'users.update'),
  ('manager', 'roles.read'),

  ('support', 'users.read'),
  ('support', 'roles.read')
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
