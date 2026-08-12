-- Role-based access control: roles, permissions, profiles, audit log.
--
-- Model (see docs/ARCHITECTURE.md §7b):
--   * Roles are global — a user is an admin of the app, not of an org.
--   * A custom access token hook stamps roles and permissions into the JWT, so RLS
--     policies read them from the token instead of joining on every row.
--   * Clients may READ their own roles; all writes happen through the NestJS API
--     with the service_role key. There is deliberately no INSERT/UPDATE/DELETE
--     policy on user_roles — privilege escalation is not expressible from a client.

-- ---------------------------------------------------------------- enums

create type public.app_role as enum ('admin', 'manager', 'support', 'member');

create type public.app_permission as enum (
  'users.read',
  'users.invite',
  'users.update',
  'users.disable',
  'roles.read',
  'roles.assign',
  'audit.read'
);

-- ---------------------------------------------------------------- tables

-- Mirror of auth.users that clients are allowed to read. auth.users itself is not
-- exposed to the API, so the admin user list needs this.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  disabled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Client-readable projection of auth.users. Populated by the on_auth_user_created trigger.';

create table public.user_roles (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references auth.users (id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (user_id, role)
);

comment on table public.user_roles is
  'Role grants. Writable only by service_role (the NestJS API) — no client write policy exists.';

create table public.role_permissions (
  id bigint generated always as identity primary key,
  role public.app_role not null,
  permission public.app_permission not null,
  unique (role, permission)
);

comment on table public.role_permissions is
  'Role to permission map. Configuration data, readable by any authenticated user.';

create table public.role_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users (id) on delete set null,
  subject_id uuid not null references auth.users (id) on delete cascade,
  action text not null check (action in ('grant', 'revoke', 'invite', 'disable', 'enable')),
  role public.app_role,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.role_audit_log is
  'Append-only record of privilege changes. Written by the API with service_role.';

-- Indexes on every column an RLS policy or a foreign key touches.
create index user_roles_user_id_idx on public.user_roles (user_id);
create index user_roles_granted_by_idx on public.user_roles (granted_by);
create index role_permissions_role_idx on public.role_permissions (role);
create index role_audit_log_subject_idx on public.role_audit_log (subject_id, created_at desc);
create index role_audit_log_actor_idx on public.role_audit_log (actor_id);
create index profiles_email_idx on public.profiles (lower(email));

-- ---------------------------------------------------------------- auth hook

-- Runs inside Supabase Auth when a token is issued. Adds the user's roles and
-- permissions to the JWT claims so policies can authorize without a table join.
create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  claims jsonb;
  roles jsonb;
  permissions jsonb;
  uid uuid := (event ->> 'user_id')::uuid;
begin
  select coalesce(jsonb_agg(distinct ur.role::text), '[]'::jsonb)
    into roles
    from public.user_roles ur
   where ur.user_id = uid;

  select coalesce(jsonb_agg(distinct rp.permission::text), '[]'::jsonb)
    into permissions
    from public.user_roles ur
    join public.role_permissions rp on rp.role = ur.role
   where ur.user_id = uid;

  claims := coalesce(event -> 'claims', '{}'::jsonb);
  claims := jsonb_set(claims, '{app_roles}', roles);
  claims := jsonb_set(claims, '{app_permissions}', permissions);

  return jsonb_set(event, '{claims}', claims);
end;
$$;

-- Only Supabase Auth may run the hook.
grant usage on schema public to supabase_auth_admin;
grant execute on function public.custom_access_token_hook (jsonb) to supabase_auth_admin;
revoke execute on function public.custom_access_token_hook (jsonb) from authenticated, anon, public;
grant select on public.user_roles, public.role_permissions to supabase_auth_admin;

-- ---------------------------------------------------------------- authorize()

-- Reads the permission claim off the current JWT. No table access, so it is cheap
-- enough to call from a policy, and it cannot leak rows.
create or replace function public.authorize(requested_permission public.app_permission)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (select auth.jwt() -> 'app_permissions') ? requested_permission::text,
    false
  );
$$;

comment on function public.authorize (public.app_permission) is
  'True when the caller''s JWT carries the permission. Claims are refreshed on token refresh, so a revoked permission persists until then — see revoke_all_sessions in the API for the immediate path.';

-- ---------------------------------------------------------------- triggers

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- RLS

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.role_audit_log enable row level security;

-- profiles: everyone sees themselves; users.read sees everyone.
create policy profiles_select_self on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy profiles_select_with_permission on public.profiles
  for select to authenticated
  using ((select public.authorize('users.read')));

-- A user may edit their own display fields. Admin edits go through the API.
create policy profiles_update_self on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- user_roles: read your own grants, or all of them with roles.read.
-- No write policy by design: grants are service_role only.
create policy user_roles_select_self on public.user_roles
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy user_roles_select_with_permission on public.user_roles
  for select to authenticated
  using ((select public.authorize('roles.read')));

-- The auth hook runs as supabase_auth_admin and must read grants to build claims.
create policy user_roles_select_auth_admin on public.user_roles
  for select to supabase_auth_admin
  using (true);

-- role_permissions: configuration, not user data.
create policy role_permissions_select on public.role_permissions
  for select to authenticated
  using (true);

create policy role_permissions_select_auth_admin on public.role_permissions
  for select to supabase_auth_admin
  using (true);

-- audit log: read with audit.read, write with service_role only.
create policy role_audit_log_select on public.role_audit_log
  for select to authenticated
  using ((select public.authorize('audit.read')));
