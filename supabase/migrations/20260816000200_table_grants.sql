-- Table privileges for the RBAC and notification tables.
--
-- Privileges and policies are two separate gates. A policy decides *which rows* a
-- role may touch; it grants no access by itself, and the Supabase CLI hands out no
-- table privileges by default. So every client read of these tables failed with
-- "permission denied for table ..." before a single policy was consulted — auth
-- and notifications were both broken on a fresh `supabase db reset`.
--
-- This is a separate migration because the ones that created these tables have
-- already been applied and cannot be edited.
--
-- The grants below are deliberately the narrowest set that makes each existing
-- policy usable — matching the policies, not widening them:
--
--   * `anon` gets nothing. Every policy on these tables is `to authenticated`.
--   * No INSERT anywhere. Rows in user_roles, role_audit_log and notifications are
--     written by the API with service_role, which bypasses both gates.
--   * UPDATE is column-level, so the privilege says what the policy comment always
--     claimed — see below.

-- profiles: readable per profiles_select_self / _select_with_permission.
grant select on public.profiles to authenticated;

-- profiles_update_self says "a user may edit their own display fields", but the
-- policy restricts the *row*, not the columns — a table-wide UPDATE would let a
-- user clear their own `disabled_at` and undo an admin disabling them, or rewrite
-- the email this table projects. Column-level is what makes the comment true.
grant update (full_name, avatar_url) on public.profiles to authenticated;

-- user_roles: read your own grants, or all of them with roles.read. No write
-- privilege at all — privilege escalation must stay inexpressible from a client,
-- which is the whole point of user_roles having no write policy.
grant select on public.user_roles to authenticated;

-- role_permissions: configuration data, readable by any signed-in user.
grant select on public.role_permissions to authenticated;

-- role_audit_log: readable with audit.read. Append-only, and only by the API.
grant select on public.role_audit_log to authenticated;

-- notifications: owners read, mark read, and dismiss their own rows.
grant select, delete on public.notifications to authenticated;

-- "Owners may only flip read_at" is what the policy comment says; the policy keeps
-- the row on the same user but does not restrict columns, so without this being
-- column-level an owner could rewrite the title and body of their own notification.
grant update (read_at) on public.notifications to authenticated;
