# docs-layout

The documentation shell: sticky header, sidebar tree, article, "on this page" rail,
prev/next pager. One layout, configured per app — `web` and `admin` can both mount it
and differ only in what they provide.

```
┌──────────────────────────────────────────────────────────────┐
│ header: mobile nav · wordmark · version · actions · repo     │
├───────────┬──────────────────────────────────┬───────────────┤
│ tree      │ breadcrumb                       │ On this page  │
│ (sticky)  │ <router-outlet />                │ (sticky)      │
│           │ edit this page                   │               │
│           │ prev / next                      │               │
└───────────┴──────────────────────────────────┴───────────────┘
```

## Mounting it

```ts
// app.routes.ts — before the '' dashboard route, which prefix-matches everything
{
  path: 'docs',
  component: DocsLayout,
  children: [
    { path: '', pathMatch: 'full', redirectTo: 'introduction' },
    {
      path: 'introduction',
      loadComponent: () => import('./pages/docs/introduction').then((m) => m.DocsIntroduction),
    },
  ],
}
```

```ts
// app.config.ts
...provideDocsLayout({
  title: environment.appName,
  version: 'v0.1',
  homePath: '/docs',
  repositoryUrl: 'https://github.com/org/repo',
  editBaseUrl: 'https://github.com/org/repo/edit/main/content',
  navigation: {
    sections: [
      {
        label: 'Getting started',
        items: [
          { label: 'Introduction', path: '/docs/introduction' },
          { label: 'Installation', path: '/docs/installation', badge: 'New' },
        ],
      },
      {
        label: 'Reference',
        collapsible: true,
        items: [{ label: 'Angular docs', path: 'https://angular.dev', external: true }],
      },
    ],
  },
}),
```

`provideDocsLayout` returns an **array**, so spread it into `providers`. It also accepts
`headerActions: [ThemeToggle]` — components rendered at the right of the header, the
same escape hatch `DASHBOARD_HEADER_ACTIONS` gives the dashboard, and the reason this
lib depends on no feature.

## Things worth knowing

- **`path` in the tree is an absolute route path.** The sidebar hands it to `routerLink`
  and the pager finds the current page by comparing it to the router URL; a relative
  segment has no route for the store to resolve it against. `external: true` renders a
  plain anchor and is skipped by prev/next — it is not part of the reading order.
- **The TOC reads the rendered article, not an input.** Pages come through
  `<router-outlet />`, so `DocsToc` scans `h2`/`h3` out of the DOM, assigns ids where a
  heading has none, and re-scans through a `MutationObserver` when the page swaps or a
  `@defer` block fills in. Authored ids always win, so `<h2 id="rls">` stays `#rls`.
- **All of that is browser-only.** `web` prerenders these routes; on the server the rail
  renders nothing and appears after hydration through a signal update rather than a DOM
  write. The first scan is scheduled with `afterNextRender` for the same reason — see the
  `error-layout` note in `CLAUDE.md` about hydration.
- **Scroll offset is one number.** `scrollOffset` (default 96) drives both the scroll-spy
  line and the `scroll-margin-top` written onto each heading, so anchor jumps land below
  the sticky header. Change the header height and change this with it.
- **Active styling uses `data-[active]` and `!` utilities on purpose.** `text-foreground`
  and `text-muted-foreground` are the same CSS property, so which one wins is decided by
  Tailwind's output order, not by class order in the attribute. Variants and the `!`
  suffix are what make the active item actually win.
- **Vertical rhythm lives on the `<article>`, not in pages.** The `hlm*` typography
  directives style a heading; they do not space a document. Pages stay plain markup.
- **The mobile tree lives in the header.** The sheet trigger has to sit inside
  `<hlm-sheet>` to reach it through the element injector, and it closes itself on
  navigation via `DocsSidebarNav`'s `navigated` output.
- **No `data-access` dependency.** Like `error-layout`, this shell renders with no
  Supabase configured. Put anything that needs a session in a `headerActions` component.

## State

`DocsNavStore` (`signalStore({ providedIn: 'root' })`) holds the tree and everything
derived from the current URL: `sections`, `pages`, `currentPath`, `activeLink`,
`activeSection`, `previousPage`, `nextPage`. It clones the injected config for the same
reason `SidebarStore` does — badges are mutated at runtime and the provider value is
shared. Use `updateBadge(label, badge)` to flag a page, `setNavigation(config)` to swap
the whole tree (docs loaded from a manifest or a CMS).
