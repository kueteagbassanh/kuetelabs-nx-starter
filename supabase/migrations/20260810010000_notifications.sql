-- In-app notifications.
--
-- Producers are server-side: the API writes rows with the service_role key when
-- something happens worth telling a user about (a role change, an invite). There is
-- no client insert policy, so a browser cannot notify another user.
--
-- Consumers read their own rows through RLS and subscribe to Realtime for live
-- delivery. Marking read is the one client write, restricted to the owner's rows.

create type public.notification_type as enum (
  'role.granted',
  'role.revoked',
  'user.invited',
  'user.disabled',
  'user.enabled',
  'system'
);

create table public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.notification_type not null,
  title text not null check (char_length(title) between 1 and 200),
  body text check (char_length(body) <= 2000),
  -- Where clicking the notification should take the user, e.g. '/users'.
  action_url text check (action_url is null or action_url like '/%'),
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.notifications is
  'Per-user in-app notifications. Written by the API (service_role); users may read and mark their own as read.';

-- The list query is "my notifications, newest first".
create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

-- The unread badge counts only unread rows, so index just those.
create index notifications_unread_idx
  on public.notifications (user_id)
  where read_at is null;

alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select to authenticated
  using ((select auth.uid()) = user_id);

-- Owners may only flip read_at; the with check keeps the row on the same user.
create policy notifications_update_own on public.notifications
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy notifications_delete_own on public.notifications
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- No insert policy: notifications come from the API with service_role.

-- Realtime delivery. RLS still applies to the stream, so a client only receives
-- changes to its own rows.
alter publication supabase_realtime add table public.notifications;
