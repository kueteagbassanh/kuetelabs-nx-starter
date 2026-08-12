# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Workspace

Nx 22 monorepo (npm, `package-lock.json` — no scripts in `package.json`, everything runs through `npx nx`). Three apps, ~70 libraries:

- `apps/web` — Angular 21 app with **SSR** (`outputMode: server`, `main.server.ts` + `server.ts`), client hydration with event replay, standalone/zoneless-style config in `src/app/app.config.ts`.
- `apps/admin` — Angular 21 SPA (no SSR — it is entirely behind auth), internal back-office, dev server on 4300. Shares `theme`, `dashboard-layout`, card components, and `charts` with `web`; differs only in its `DASHBOARD_MENU_CONFIG` and its `provideIcons` set.
- `apps/api` — NestJS 11, built with webpack (`@nx/webpack`), global route prefix `/api`, port 3000.
- `libs/frontend/ui/components/*` — spartan/ui "helm" components, **vendored into this repo** as buildable Angular libraries (`@nx/angular:ng-packagr-lite`), one lib per component, prefix `hlm`.
- `libs/frontend/layouts/*` — `auth-layout`, `dashboard-layout`, `error-layout`, `landing-layout`; each owns its own container component, routes, and (for dashboard) sidebar state.
- `libs/frontend/features/*`, `libs/backend`, `libs/shared` — scaffolded but currently empty; see `docs/ARCHITECTURE.md` §3 for what belongs in each.
- `supabase/` — local Supabase CLI config (`project_id = kuetelabs-nx-starter`, API 54321, DB 54322). No migrations yet.

Intended runtime split (Supabase-first): the Angular apps talk to Supabase directly for auth, RLS-protected CRUD, realtime, and storage; `apps/api` handles only work needing a secret — service-role writes, Resend email, webhooks, cron, third-party APIs — and verifies the caller's Supabase JWT rather than issuing its own. `@supabase/supabase-js` and `resend` are not installed yet.

## Commands

```sh
npx nx serve web                 # Angular dev server (4200)
npx nx serve admin               # admin dev server (4300)
npx nx serve api                 # Nest dev server (3000, routes under /api)
npx nx build web                 # production by default (dist/apps/web)
npx nx run web:build:development
npx nx test web                  # @angular/build:unit-test (vitest), watch:false
npx nx test api                  # jest via @nx/jest plugin
npx nx lint <project>
npx nx run-many -t lint test build
npx nx affected -t lint test build
npx nx show project web --web    # inspect inferred + explicit targets
npx nx graph

node tools/screenshot.mjs           # screenshot / in light + dark (dev server must be running)
node tools/screenshot.mjs /login --theme dark --out .screenshots
```

`tools/screenshot.mjs` renders routes through Playwright and writes to `.screenshots/` (gitignored). Use it to verify UI changes — a passing build only proves compilation, and both chart theming bugs found so far were invisible to `nx build`. It exits non-zero on an uncaught page error, so it doubles as a smoke check. Requires `npx playwright install chromium`; on Ubuntu 26.04 that needs Playwright >= 1.62 (1.60 has no matching Chromium build).

Single test:

- vitest (web/libs): `npx nx test web --include=<glob>` or `--filter="<test name>"`, `--watch`
- jest (api): `npx nx test api -- -t "<test name>"` or pass a path pattern

Nx Cloud is not configured; `analytics` is off in `nx.json`.

## Import aliases & module boundaries

Path aliases live in `tsconfig.base.json`, one entry per component lib plus wildcards:

- `@kuetelabs/frontend/ui/components/<name>` → `libs/frontend/ui/components/<name>/src/index.ts`
- `@kuetelabs/frontend/layouts/<name>` → `libs/frontend/layouts/<name>/src/index.ts`

Always import across libs via these aliases (never relative paths into another lib), and only through the lib's `src/index.ts` barrel.

`eslint.config.mjs` enforces `@nx/enforce-module-boundaries` with `enforceBuildableLibDependency: true` and a layered tag system:

| sourceTag | may depend on |
| --- | --- |
| `type:app` | `type:layout`, `type:feature`, `type:data-access`, `type:ui`, `type:util` |
| `type:layout` | `type:feature`, `type:data-access`, `type:ui`, `type:util` |
| `type:feature` | `type:data-access`, `type:ui`, `type:util` |
| `type:ui` | `type:ui`, `type:util` |

New libs must carry a `type:*` tag in `project.json` or they will be unusable from tagged consumers. `platform:*` tags (`platform:web`, `platform:frontend`) exist on projects, but the platform-isolation `depConstraints` block is still an empty placeholder.

**Architecture blueprint:** `docs/ARCHITECTURE.md` is the source of truth for folder structure, tag taxonomy, the Supabase/Nest split, Resend placement, scaffolding commands, and the open migration steps. Read it before adding a lib, an app, or a backend module.

Libs were moved from `libs/shared/ui/*` and `libs/layouts/*` to `libs/frontend/*`; the stale `@kuetelabs/components/*` and `@kuetelabs/layouts/*` imports have been repointed and `web` builds and lints clean. `dashboard-layout` exports `DASHBOARD_MENU_CONFIG` and `SidebarService` from its own barrel — there is no separate `data-access`/`ui` lib per layout any more.

## spartan/ui

`components.json` drives the spartan CLI: components are generated as buildable libraries under `libs/frontend/ui/components` with import alias `@kuetelabs/frontend/ui/components`. Use the `spartan` skill and the `spartan-ui` MCP server (declared in `.mcp.json`) when adding, composing, or debugging components rather than hand-writing them.

Component conventions (see `libs/frontend/ui/components/button`):

- Headless behavior comes from `@spartan-ng/brain` (`BrnX`) via `hostDirectives`; styling lives in an `Hlm*` directive/component.
- Variants use `cva` from `class-variance-authority`; classes are applied through `classes()` / `hlm()` from `@kuetelabs/frontend/ui/components/utils` (clsx + tailwind-merge, with a MutationObserver-based class manager). Import that util rather than reimplementing class merging.
- Icons: `@ng-icons/lucide` (names like `lucideHouse` are referenced as strings in navigation config).

## State management

**NgRx SignalStore (`@ngrx/signals`) is the convention for all shared state** — not `@Injectable` classes holding `signal()` fields. The three stores in the workspace (`AuthStore`, `UsersStore`, `SidebarStore`) are all `signalStore({ providedIn: 'root' }, ...)`. Component-local state stays a plain `signal()`.

- `withState` for shape, `withComputed` for derived values, `withMethods` for behavior, `withHooks` for lifecycle (`onInit` runs in an injection context — take `DestroyRef` there for cleanup).
- **`withEntities` for collections.** `UsersStore` holds users as entities, so a role toggle is `updateEntity(...)` — an O(1) patch instead of a list rebuild. Consumers read `store.entities()`.
- **`rxMethod` for anything with RxJS semantics** — debounce, cancellation, retry. The user search uses `debounceTime` + `distinctUntilChanged` + `switchMap`, so typing issues one request and a slow earlier response cannot overwrite a newer one. Keep `catchError` *inside* `switchMap` or the outer stream dies on the first failure.
- Mutate only through `patchState`; never assign to a state signal directly.

## Auth pages

`libs/frontend/features/auth/feature` holds login, signup, forgot/reset password, the OAuth + email callback, and a setup page; `libs/frontend/layouts/auth-layout` holds only the centered chrome. Apps compose them: `{ path: 'auth', component: AuthContainer, children: authRoutes }` plus `provideAuthPages({ ... })` for app name, post-login redirect, `signupEnabled`, and OAuth providers. `admin` is invite-only, `web` allows signup — same components, different config.

- **Never prerender `auth/**`** — `RenderMode.Client` in `app.routes.server.ts`. A prerendered auth page is a logged-out shell for every visitor, and the Supabase session lives in `localStorage`.
- The callback route handles OAuth, email confirmation, and recovery; recovery is forwarded to `reset-password`.
- Forgot-password and signup deliberately give identical responses whether or not the account exists — do not "improve" those messages.
- Routes are behind `supabaseConfiguredGuard()`, which diverts to `/auth/setup` when no anon key is set.
- **Guards live in `libs/frontend/data-access/supabase`, and apps wire them.** The dashboard shell
  route carries `canActivate: [authenticatedGuard]`; signed-out users land on
  `/auth/login?returnUrl=<url>` and are sent back after login. `guestGuard` goes on login/signup
  only — `reset-password` needs the recovery session and `callback` runs mid-sign-in. Paths come
  from the `AUTH_NAVIGATION` token, not literals.
- **Every guard awaits `AuthStore.loading` before deciding.** `getSession()` is async, so a
  synchronous `isAuthenticated()` check bounces signed-in users to login on every hard refresh.
- With no anon key the guards pass through (dev warning) so a fresh clone stays navigable, and
  `returnUrl` is accepted only when it starts with a single `/` — otherwise login is an open
  redirect. See `docs/ARCHITECTURE.md` §7d.

## Error pages

`libs/frontend/layouts/error-layout` holds every error screen — 400, 401, 403, 404, 408, 410, 429,
500, 502, 503, 504, `offline`, `maintenance`, and a generic `unknown` fallback. Unlike auth, the
pages stay in the layout lib: they hold no logic and depend on nothing but `type:ui`. Full model in
`docs/ARCHITECTURE.md` §7e.

- **One `ErrorPage` component; the difference between screens is data in `ERROR_CATALOG`.** Add a
  status by adding a catalog entry — `createErrorRoutes()` generates the route from it. Don't write
  a component per status.
- Apps compose `{ path: 'error', children: errorRoutes }` **before** the `''` dashboard route (which
  prefix-matches everything) and `notFoundRoute()` last. 404 renders in place rather than
  redirecting, so the broken URL stays in the address bar.
- `/forbidden` (`AUTH_NAVIGATION.forbiddenPath`) is mounted inside the dashboard shell with
  `data: { code: 403, inline: true }` — `inline` swaps `min-h-svh` for `flex-1`. It is
  `RenderMode.Client` in `app.routes.server.ts`: it is behind `authenticatedGuard`, so prerendering
  it ships a logged-out render, exactly as with `auth/**`.
- **`web` prerenders `/error/*`, so nothing browser-only may change the DOM during hydration.**
  "Go back" depends on `history.length` and is resolved in `afterNextRender`, not the constructor.
  Route paths are static for the same reason — `error/:code` would need `getPrerenderParams`.
- The lib imports nothing from `data-access` on purpose, so these screens still render when Supabase
  is missing or broken. `ERROR_PAGES_CONFIG.loginPath` therefore mirrors `AUTH_NAVIGATION.loginPath`
  by hand — keep the two in step.

## Docs pages

`libs/frontend/layouts/docs-layout` is the documentation shell: sticky header, sidebar tree,
article, "on this page" rail, prev/next pager. Apps mount it as a routed component
(`{ path: 'docs', component: DocsLayout, children: [...] }`) and configure it with
`provideDocsLayout({ title, navigation, repositoryUrl, editBaseUrl, headerActions })` — which
returns an **array**, so spread it. Full notes in that lib's README.

- **Tree paths are absolute route paths** (`/docs/installation`). The sidebar feeds them to
  `routerLink` and `DocsNavStore` finds the current page by comparing them to the router URL;
  `external: true` links are plain anchors and sit outside the prev/next reading order.
- **The TOC reads the rendered article** — pages arrive through `<router-outlet />`, so it scans
  `h2`/`h3` from the DOM, assigns ids where a heading has none (authored ids win), and re-scans
  through a `MutationObserver`. All browser-only: the first scan is in `afterNextRender`, so a
  prerendered docs page hydrates before anything touches it.
- **`scrollOffset` is one number for two jobs** — the scroll-spy line and the `scroll-margin-top`
  written onto each heading. Change the header height and change it too.
- Active states use `data-[active]` variants and `!` utilities deliberately: `text-foreground` and
  `text-muted-foreground` are the same property, so Tailwind's output order decides the winner,
  not class order in the attribute.
- Like `error-layout`, this lib imports nothing from `data-access` — the docs render with no
  Supabase configured. Anything needing a session goes in a `headerActions` component.

## Notifications

In-app center + toasts. `notifications` has no client insert policy — the API writes rows with the service_role key from the same hooks that audit RBAC changes (`libs/backend/notification`). Reads and mark-as-read go straight to Supabase under RLS; delivery is a Realtime subscription in `NotificationsStore`.

- Toasts go through `ToastService` (`@kuetelabs/frontend/ui/toast`), never `toast` from sonner directly. Requires `<hlm-toaster />` in the app shell.
- The store is `type:data-access` and cannot import a UI lib, so it exposes `lastArrival` and `NotificationBell` (feature layer) raises the toast.
- The bell mounts via `DASHBOARD_HEADER_ACTIONS`, so the shared layout stays free of feature deps.
- **Anything that touches Supabase at construction must be gated on `isSupabaseConfigured(...)`** — see `apps/admin/src/app/app.config.ts`. Mounting the bell without an anon key takes the whole shell down.

## Auth, roles, permissions

Global roles; permissions ride in the JWT (stamped by `custom_access_token_hook`); every mutation goes through the API with the service_role key. Full model in `docs/ARCHITECTURE.md` §7b — read it before touching a policy or adding a permission.

- **`user_roles` has no client write policy.** Grants happen only in `libs/backend/user-management`, which audits every change. Do not add a write policy to make something convenient.
- **Enforcement is RLS + the API.** `permissionGuard` and `*libHasPermission` decide what renders; they are not security. Never let a check exist only in Angular.
- **Claims are as fresh as the token.** A revoked permission survives until refresh — `AuthStore.refreshClaims()` forces it, and disabling a user calls `auth.admin.signOut(id, 'global')`.
- Roles/permissions flow from the DB enums → `libs/shared/database-types` → `APP_ROLES`/`APP_PERMISSIONS` in `libs/shared/domain`. Adding one is a migration plus `supabase gen types`; everything that needs updating then fails to compile.
- Frontend never imports `@supabase/supabase-js` outside `libs/frontend/data-access/supabase`; the backend never reads the service key outside `libs/backend/supabase`.

## Charts

Import charts from **`@kuetelabs/frontend/ui/charts`** (`lib-area-chart`, `lib-line-chart`, `lib-bar-chart`, `lib-donut-chart`) — feature code must not import `angular-chrts` directly. The wrapper owns the SSR guard, palette assignment (`series: [{ key, label }]` -> `var(--chart-n)` in order), and legend policy; see that lib's README. `apps/web/src/app/pages/overview.ts` is the reference wiring.

Underlying library: **Angular Charts** (`angular-chrts`, https://angularcharts.com/docs) — Unovis-backed, spartan-styled, signal inputs. Pin the `latest` tag (`0.1.0-beta.7`); `1.0.0-beta.2` on npm is broken (imports the unpublished `@vue-chrts/shared`). Selectors are `ngx-area-chart`, `ngx-line-chart`, `ngx-bar-chart`, `ngx-donut-chart`, `ngx-bubble-chart`, `ngx-gantt-chart`; chart types like `BulletLegendItemInterface` come from `@unovis/ts` in this version, not from `angular-chrts` as the website shows (the site documents the unreleased 1.x API).

Charts need the DOM — always guard with `@if (isBrowser)` (`isPlatformBrowser(inject(PLATFORM_ID))`), or `apps/web`'s prerender step fails.

Theming is entirely CSS-variable driven from the shared theme lib (`libs/frontend/ui/theme`): `--chart-1..5` (light + dark), Tailwind utilities via `@theme inline` (`bg-chart-1`, `stroke-chart-2`), and a `--vis-*` / `--vis-dark-*` bridge mapping Unovis's axis, grid, tooltip, crosshair, legend, and stacked-bar-gap variables onto the design tokens. Pass series colors as `color: 'var(--chart-1)'`; never hardcode hex in a chart component. The palette intentionally diverges from stock shadcn for CVD separation — see `docs/ARCHITECTURE.md` §7a before changing a value.

`.npmrc` sets `legacy-peer-deps=true` solely because `angular-chrts` still declares an Angular `^19` peer; remove it once upstream updates.

## Styling

Tailwind v4 via PostCSS (`.postcssrc.json` → `@tailwindcss/postcss`); no `tailwind.config.js`.

The design system lives in **`libs/frontend/ui/theme`**, shared by every app: `index.css` (layer order, Tailwind imports, spartan preset), `tokens.css` (oklch tokens for light and `:root.dark`), `charts.css` (chart utilities + Unovis bridge), `base.css`. An app's `styles.css` is a one-line import of `index.css` plus anything app-specific. Change tokens in the lib, never in a component lib or an app.

Two things to know when adding an app: register its entry stylesheet in `build.options.styles`, and add `"implicitDependencies": ["theme"]` to its `project.json` — Nx's graph does not follow CSS `@import`, so without it `nx affected` misses token changes. Tailwind's source scanning is workspace-wide (build cwd is the root), which is why `index.css` carries `@source not '**/*.md'` — docs mentioning class names were emitting real utilities.

## Layouts & routing

`apps/web/src/app/app.routes.ts` composes layout components/routes exported from the layout libs; layout libs export their own `Routes` (e.g. `authLayoutRoutes`). The dashboard sidebar is data-driven: the app provides a `SidebarConfig` for the `DASHBOARD_MENU_CONFIG` injection token in `app.config.ts`, and `SidebarService` (in `dashboard-layout`) holds it in a signal with helpers like `updateBadge`. Add nav entries by editing that config object, not the sidebar component.

## Environments

`apps/web/src/environments/environment.ts` reads `process.env['API_URL']` / `process.env['APP_NAME']` (see `.env.example`); `environment.prod.ts` is swapped in by `fileReplacements` in the production build configuration.

## TypeScript

Strict everywhere: per-project tsconfigs enable `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, plus Angular `strictTemplates` and `strictInjectionParameters`. Prettier uses single quotes.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
