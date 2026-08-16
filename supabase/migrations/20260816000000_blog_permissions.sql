-- Blog permissions.
--
-- Deliberately its own migration: Postgres refuses to use a new enum value in the
-- same transaction that added it ("unsafe use of new value of enum type"). The
-- next migration seeds role_permissions and writes policies that cast these
-- literals to app_permission, so they must already be committed.

alter type public.app_permission add value if not exists 'blog.read';
alter type public.app_permission add value if not exists 'blog.write';
alter type public.app_permission add value if not exists 'blog.publish';
