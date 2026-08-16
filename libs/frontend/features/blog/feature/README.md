# blog-feature

Screens for the blog: the public feed and article, and the authoring list and editor.
Full model in [docs/ARCHITECTURE.md §7g](../../../../../docs/ARCHITECTURE.md).

## Mounting

Two route sets, two different surfaces:

```ts
// Public — inside the marketing shell. loadChildren, not a static import: nothing
// in the initial bundle references the blog.
{
  path: 'blog',
  loadChildren: () =>
    import('@kuetelabs/frontend/features/blog/feature').then((m) => m.blogRoutes),
}

// Authoring — inside the dashboard shell, behind the session guard.
{
  path: 'blog',
  loadChildren: () =>
    import('@kuetelabs/frontend/features/blog/feature').then((m) => m.blogAdminRoutes),
}
```

The authoring screens need `BLOG_API_URL` provided (the NestJS base URL, e.g.
`http://localhost:3000/api`). The public pages need nothing but Supabase, and render an empty state
without it.

`:slug` and `:id` arrive as routed inputs, so the app's router needs
`withComponentInputBinding()` — both apps here have it.

## Things worth knowing

- **The public feed filters on `status` in the query, not only through RLS.** An editor holding
  `blog.read` matches a second, broader policy, and Postgres OR-es policies together — so RLS alone
  would show drafts on the public site as soon as an editor signs in.
- **Copy uses `injectCopyResolver()` with literal fallbacks**, not the transloco pipe, so the pages
  still render in an app that never called `provideI18n()`. `web` supplies the `blog.*` keys in
  `apps/web/src/app/i18n/`.
- **The authoring screens are deliberately untranslated**, like the other back-office features.
- **Publishing is a button, not a form field.** The editor never sends `status` on an update: it is
  a separate permission and a separate endpoint.
- **`markdown.ts` escapes before it transforms.** Authored HTML renders as text, and link hrefs are
  restricted to `http(s)`, `mailto:`, and single-slash in-app paths. Angular's sanitizer is the
  second layer, not the only one. `markdown.spec.ts` pins the injection cases — keep them if the
  renderer is ever replaced with `marked`.
- **SSR waits for the data** because the store holds a `PendingTasks` task open around each query.
  Removing it makes `/blog` serve an empty shell that fills in after hydration, with no error
  anywhere.
