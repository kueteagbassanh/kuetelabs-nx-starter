# Architecture

Blueprint for this starter kit: an Nx monorepo where **Angular + spartan/ui** is the frontend,
**Supabase** is the primary backend, **NestJS** owns privileged server-side work, and
**Resend** sends email. Optimised for one thing: cloning this repo and having a new product
running the same day, without re-litigating structure.

---

## 1. Locked decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Backend split | **Supabase-first, Nest for privileged work** | Angular talks to Supabase directly for auth, RLS-protected CRUD, realtime, storage. Nest handles anything needing a secret: service-role writes, Resend email, webhooks, payments, cron, third-party APIs. |
| App footprint | **`web` + `admin` + `api`** | Two frontends from day one keeps app-agnostic vs app-specific boundaries honest — a lib that only compiles inside `web` gets caught immediately. |
| UI components | **One buildable lib per spartan component** | Matches `@spartan-ng/cli` output, so `nx g @spartan-ng/cli:migrate-*` upgrades apply cleanly. Per-component Nx caching and `affected` granularity. Cost is config volume, which generators absorb. |
| Auth authority | **Supabase Auth** | Nest never issues its own tokens; it *verifies* the Supabase JWT. One identity system, one session, no sync problem. |

**Consequence to internalise:** with Supabase-first, **RLS is the security boundary**, not the
Angular code. Any table reachable by the anon key must have RLS enabled and policies tested.
The `supabase-postgres-best-practices` skill covers schema, RLS, and policy testing — load it
before writing migrations.

---

## 2. Runtime topology

```
                    anon key + user JWT (RLS enforced)
   ┌──────────────┐ ─────────────────────────────────────► ┌─────────────────────┐
   │  apps/web    │   auth · CRUD · realtime · storage      │      Supabase       │
   │  apps/admin  │                                         │  Postgres + Auth    │
   │  (Angular)   │ ─────────────┐                          │  Storage + Realtime │
   └──────────────┘   user JWT   │                          └─────────────────────┘
                                  ▼                                     ▲
                          ┌──────────────┐   service_role key           │
                          │   apps/api   │ ─────────────────────────────┘
                          │  (NestJS)    │
                          └──────┬───────┘
                                 │ RESEND_API_KEY
                                 ▼
                          ┌──────────────┐
                          │    Resend    │
                          └──────────────┘
```

**Route work to the right side with this test:**

| Send it to Supabase directly when… | Send it to Nest when… |
| --- | --- |
| The operation is expressible as an RLS-protected read/write | It needs the `service_role` key or any other secret |
| The user's own JWT is sufficient authorisation | It must bypass or span RLS (admin ops, cross-tenant reports) |
| You want realtime / storage / auth | It calls a third party (Resend, Stripe, OpenAI) |
| Latency matters and there is no business rule to enforce | It receives webhooks, runs cron, or must be atomic across systems |

Nest **verifies** the caller: a `SupabaseAuthGuard` validates the incoming `Authorization:
Bearer <supabase jwt>` and populates `request.user`. It does not maintain its own user table.

---

## 3. Target folder structure

```
apps/
  web/                     Angular SSR — customer-facing product (port 4200)
  admin/                   Angular SPA — internal back-office (port 4300)
  api/                     NestJS — privileged operations
  web-e2e/  admin-e2e/     Playwright
  api-e2e/                 Jest

libs/
  frontend/                                     platform:frontend
    ui/
      components/<name>/   spartan helm components (buildable)       type:ui
      theme/               design tokens, dark mode, theme switcher  type:ui
      patterns/            composed app-level UI: page-header,
                           data-table, empty-state, confirm-dialog   type:ui
    layouts/<name>/        auth · dashboard · landing · error        type:layout
    features/<domain>/
      feature/             routed smart components + Routes          type:feature
      ui/                  dumb presentational components            type:ui
      data-access/         signal stores + Supabase/API calls        type:data-access
    data-access/
      supabase/            client provider, session store, guards    type:data-access
      api/                 typed HTTP client for the Nest API        type:data-access
    util/
      forms/  testing/  formatting/                                  type:util

  backend/                                      platform:backend
    core/                  config, logger, filters, interceptors     type:core
    supabase/              service-role client, admin queries        type:data-access
    email/                 Resend wrapper + templates                type:data-access
    <domain>/feature/      Nest feature modules (webhooks, billing)  type:feature

  shared/                                       platform:shared
    domain/                DTOs + zod schemas used by FE and BE      type:util
    database-types/        generated: supabase gen types typescript  type:util
    util/                  isomorphic helpers                        type:util

supabase/
  config.toml
  migrations/              declarative schema changes
  seed.sql
  functions/               edge functions (only if truly edge-bound)

tools/
  generators/              workspace generators (see §9)
docs/
  ARCHITECTURE.md          this file
```

### Why this shape

- **`libs/frontend | backend | shared` at the top level.** The first question about any lib is
  "where does it run" — that determines which secrets and APIs it may touch. Making it the top
  directory means a lint rule and a glance at the path both answer it.
- **Domain second, type third** inside `features/` (`features/auth/data-access`, not
  `data-access/auth`). Everything about billing lives under one folder; deleting a feature is
  `rm -rf` plus removing one route. This is the Nx-recommended grouping and it is what makes the
  starter cheap to strip down for a new project.
- **`ui/patterns` separate from `ui/components`.** `components/*` is *vendored upstream code* that
  the spartan CLI rewrites; hand-written composites must live somewhere the migrations never
  touch. Never edit `components/*` to add product-specific behaviour — wrap it in `patterns/`.

---

## 4. Tags and boundaries

Every project carries exactly one `platform:*` and one `type:*` tag; feature-scoped libs add a
`scope:<domain>` tag.

| Tag | Meaning |
| --- | --- |
| `platform:frontend` / `platform:backend` / `platform:shared` | Where the code runs |
| `type:app` | Deployable application |
| `type:layout` | Page chrome + route composition |
| `type:feature` | Smart, routed, domain-aware |
| `type:ui` | Presentational only, no domain services |
| `type:data-access` | State + I/O (Supabase, HTTP) |
| `type:core` | Backend cross-cutting infrastructure |
| `type:util` | Pure functions, types, schemas |
| `scope:<domain>` | `auth`, `billing`, `notification`, … |

Dependency direction (a layer may only import from layers below it):

```
app  →  layout  →  feature  →  data-access  →  util
                      ↓            ↓
                     ui  ─────────────────────►  util
```

The `type:*` half of this is **already enforced** in `eslint.config.mjs`. Two gaps remain — the
`platform:*` block is an empty placeholder, and `scope:*` is unused. Fill them in:

```js
// eslint.config.mjs → depConstraints
// --- PLATFORM ISOLATION ---
{ sourceTag: 'platform:frontend', onlyDependOnLibsWithTags: ['platform:frontend', 'platform:shared'] },
{ sourceTag: 'platform:backend',  onlyDependOnLibsWithTags: ['platform:backend',  'platform:shared'] },
{ sourceTag: 'platform:shared',   onlyDependOnLibsWithTags: ['platform:shared'] },

// --- REMAINING LAYERS ---
{ sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access', 'type:util'] },
{ sourceTag: 'type:core',        onlyDependOnLibsWithTags: ['type:core', 'type:util'] },
{ sourceTag: 'type:util',        onlyDependOnLibsWithTags: ['type:util'] },

// --- DOMAIN ISOLATION: cross-domain traffic goes through shared, or through a
//     domain's public barrel — never sideways into another domain's internals ---
{ sourceTag: 'scope:*', onlyDependOnLibsWithTags: ['scope:shared', 'scope:*'] },
```

`platform:shared` is what stops a `zod` schema lib from quietly importing `@nestjs/common` and
detonating the browser bundle — the single most valuable rule in the list.

---

## 5. Frontend rules

**Supabase access is centralised.** Only `libs/frontend/data-access/supabase` may import
`@supabase/supabase-js`. It exposes `provideSupabase(config)`, `injectSupabaseClient()`, an
`AuthStore` (signals: `session`, `user`, `isAuthenticated`), and route guards. Feature
`data-access` libs inject *that*, never the raw SDK — so swapping the client, adding retries, or
mocking in tests is one file.

**Feature data-access owns queries; feature components own none.** A component calls
`ordersStore.load()`, not `supabase.from('orders')`.

**State is SignalStore.** Shared state is `signalStore()` from `@ngrx/signals` — `withState` /
`withComputed` / `withMethods` / `withHooks`, mutated only through `patchState`. Collections use
`withEntities`, so patching one row is O(1) and does not rebuild the list. Anything needing
debounce, cancellation, or retry uses `rxMethod` rather than a plain async method, which makes the
RxJS semantics explicit. Component-local state stays a plain `signal()`. `OnPush` everywhere (the
vendored spartan components already are).

Worth knowing why the `rxMethod` rule exists: an async store method looks simpler and silently
drops cancellation. The user-search box is the concrete case — as an async method it fired one
request per keystroke, and a slow early response could overwrite a newer one.

**SSR + auth — the trap.** `apps/web/src/app/app.routes.server.ts` currently prerenders `**`.
Prerendering an authenticated shell serves a logged-out HTML shell to every user, and the
default Supabase client stores its session in `localStorage`, which does not exist on the
server. Split render modes explicitly:

```ts
export const serverRoutes: ServerRoute[] = [
  { path: '',        renderMode: RenderMode.Prerender },  // marketing
  { path: 'pricing', renderMode: RenderMode.Prerender },
  { path: 'auth/**', renderMode: RenderMode.Client },     // never prerender auth
  { path: 'app/**',  renderMode: RenderMode.Client },     // authenticated shell
  { path: '**',      renderMode: RenderMode.Server },
];
```

If you later need SSR *inside* the authenticated area, move the session to cookie storage so the
server can read it — do not sprinkle `isPlatformBrowser` checks through feature code.

**`admin` reuses libs, not code.** The admin app imports the same `ui/components`, `layouts`,
and `shared/domain`; it gets its own `features/admin-*` libs. If something in `web`'s features
turns out to be needed by `admin`, that is the signal to promote it to a shared feature lib —
not to import across app boundaries (which the boundary rules forbid anyway).

---

## 6. Backend rules (NestJS)

- **One module per domain** under `libs/backend/<domain>/feature`; `apps/api` is a thin composition
  root — `AppModule` imports domain modules and nothing else. Keep controllers in the lib.
- **`libs/backend/core`** holds `ConfigModule` (validated env schema), the global exception filter,
  the logging interceptor, and `SupabaseAuthGuard`. Everything else depends on it.
- **`libs/backend/supabase`** is the only place the `service_role` key is read. Expose intent-named
  methods (`createTenantOwner`, `revokeAllSessions`), never a raw admin client — a leaked admin
  client is an RLS bypass in whatever code borrows it.
- **Validation at the edge:** DTOs come from `libs/shared/domain` (zod), validated in a pipe, so the
  browser and the API enforce the same contract from the same source.
- **Webhooks verify signatures before parsing bodies**, and mutations that a third party may retry
  must be idempotent (dedupe on the provider's event id).
- The `nestjs-best-practices` skill has the module/DI/security patterns — load it before adding
  modules.

---

## 7. Email (Resend)

`libs/backend/email` is the only sender. Structure:

```
libs/backend/email/
  src/lib/email.module.ts        provides ResendClient from validated config
  src/lib/email.service.ts       sendWelcome(), sendPasswordChanged(), …
  src/lib/templates/*.tsx        React Email templates
```

Rules:

- `RESEND_API_KEY` is **server-only**. It must never appear in an Angular environment file or any
  `platform:frontend`/`platform:shared` lib. The platform boundary rule enforces the import side;
  keeping the key out of frontend env files is on you.
- The frontend requests email by calling the Nest API (`POST /api/notifications/...`), never Resend.
- Pass an **idempotency key** on every send so retries don't double-send.
- Verify Resend **webhook signatures** before trusting delivery/bounce events.
- Templates are typed by DTOs from `libs/shared/domain`, so a renamed field breaks the build rather
  than the email.
- Supabase's own auth emails (confirm signup, reset password) can be routed through Resend via
  Supabase SMTP settings — decide per project and write it down; splitting auth email across two
  providers is a debugging tax.
- Skills: `resend:resend` (API + gotchas), `resend:react-email` (templates),
  `resend:email-best-practices` (SPF/DKIM/DMARC, deliverability).

---


---

## 7a. Charts

**Default library: [Angular Charts](https://angularcharts.com/docs)** (`angular-chrts`) — signal-input
Angular components wrapping [Unovis](https://unovis.dev), built for Tailwind + spartan. It is the
right default here because it is the only Angular chart layer that shares this kit's assumptions:
spartan styling, signal inputs, and colors supplied as `var(--chart-N)` rather than a JS theme
object. Available: line, area, bar, donut, bubble, gantt, plus a standalone tooltip.

```sh
npm install angular-chrts        # @unovis/ts comes with it; installed here already
npx angular-charts add line-chart   # optional CLI scaffolding
```

```ts
import { AreaChartComponent } from 'angular-chrts';
import { BulletLegendItemInterface } from '@unovis/ts';

@Component({
  imports: [AreaChartComponent],
  template: `
    @if (isBrowser) {
      <ngx-area-chart [data]="data" [categories]="categories" [height]="250"
                      [stacked]="true" [yGridLine]="true" [xFormatter]="xFormatter" />
    }
  `,
})
export class RevenueChart {
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected data = [{ month: 'Jan', desktop: 186, mobile: 80 }];
  protected categories: Record<string, BulletLegendItemInterface> = {
    desktop: { name: 'Desktop', color: 'var(--chart-1)' },
    mobile: { name: 'Mobile', color: 'var(--chart-2)' },
  };
  protected xFormatter = (tick: number | Date) => this.data[tick as number]?.month ?? '';
}
```

### Four things the docs won't tell you

1. **Use the `latest` tag (`0.1.0-beta.7`), not `1.0.0-beta.2`.** The 1.x beta on npm imports
   `@vue-chrts/shared`, which it does not declare as a dependency and which is not published —
   it fails at bundle time with `Could not resolve "@vue-chrts/shared"`.
2. **Selectors are `ngx-*`** (`<ngx-area-chart>`, `<ngx-line-chart>`, …) in the published `0.1.x`
   package. The website documents the unreleased 1.x API (`<AreaChart>`, imports of
   `BulletLegendItemInterface` from `angular-chrts`); in `0.1.x` those types come from `@unovis/ts`.
3. **Guard every chart for SSR.** Unovis needs the DOM. `apps/web` prerenders, so an unguarded
   chart breaks the build. Wrap in `@if (isBrowser)` (or the equivalent `OnBrowserDirective` the
   site shows) — the dashboard shell should be `RenderMode.Client` anyway per §5.
4. **Unovis injects its own `:root` variable block at runtime**, so a plain `:root { --vis-* }`
   in `styles.css` loses to it on load order — which is why the upstream docs stamp `!important`
   on every variable. The bridge here declares them on `:root:root` instead: higher specificity,
   same result, nothing to unpick later. Symptom if you get this wrong: charts silently keep
   Unovis' defaults (a `#e8e9ef` grid that glares white on a dark card).
5. **`--border` is translucent in dark** (`oklch(1 0 0 / 10%)`) and Unovis drops alpha when it
   re-emits a parsed color, painting a solid white grid. The bridge derives an opaque
   `--chart-grid` via `color-mix` for grid, domain, tick, crosshair, and tooltip border.
6. **The package declares Angular `^19.0.0` as a peer** while this workspace is on Angular 21. The
   code works on 21 (verified: `nx build web` compiles and prerenders); only the range is stale.
   `.npmrc` carries `legacy-peer-deps=true` for this reason. Remove it when the peer range is fixed.

### Theming

Charts inherit the design system through CSS variables — nothing is configured per chart.
`libs/frontend/ui/theme` defines `--chart-1..5` for light and dark, exposes them as Tailwind
utilities via `@theme inline` (`bg-chart-1`, `stroke-chart-2`), and bridges them onto Unovis's
`--vis-*` variables (series colors, axis/grid/tick ink, tooltip surface, crosshair, legend, and a
2px surface gap between stacked segments). Both `--vis-*` and `--vis-dark-*` are declared and both
resolve through the same tokens, so charts stay correct whether dark mode comes from the `.dark`
class or the OS preference. Series colors are passed per series as
`categories: { key: { name, color: 'var(--chart-1)' } }`.

**The palette is not stock shadcn, deliberately.** shadcn's default `--chart-4`/`--chart-5` are
both amber — ΔE 7.4 to normal vision and 5.6 under deuteranopia, i.e. indistinguishable — and its
`--chart-3` falls below the chroma floor and reads gray. Slots 1-2 here are shadcn's values
verbatim; 3-5 are re-stepped (blue, amber, violet) so every adjacent pair clears the CVD and
normal-vision floors in both modes. Validated with the `dataviz` skill's
`scripts/validate_palette.js`; re-run it if you change a value.

One standing obligation: `--chart-4` (amber) sits at 2.34:1 against the light surface, below the
3:1 relief threshold. Any chart using slot 4 needs direct labels or an accompanying table view —
which is good practice regardless, and unavoidable for yellow on white in any palette.

Assign slots in fixed order and never cycle them: a 6th series folds into "Other" or becomes small
multiples. Color must follow the entity, not its rank, so a filter that drops a series never
repaints the survivors.


### The wrapper lib

Feature code imports `@kuetelabs/frontend/ui/charts`, never `angular-chrts` directly.
`libs/frontend/ui/charts` (tagged `platform:frontend,type:ui`) exposes `lib-area-chart`,
`lib-line-chart`, `lib-bar-chart`, and `lib-donut-chart`, and owns four decisions so no feature
has to repeat them:

- **SSR guard** — each component renders a same-height skeleton on the server and the chart after
  hydration, so prerendering never breaks and hydration doesn't shift layout.
- **Palette assignment** — callers declare `series: [{ key, label }]`; slot *n* gets
  `var(--chart-n)` in declaration order. Hex values never appear in feature code, so dark mode and
  the CVD guarantees hold everywhere. Passing more series than the palette has slots logs a dev
  warning pointing at "Other" / small multiples.
- **Legend policy** — shown for 2+ series, hidden for one.
- **Mark defaults** — 2px lines, 4px rounded bar ends, recessive grid.

The payoff beyond consistency: `angular-chrts` is a pre-1.0 package with a stale peer range. When
it breaks or gets replaced, the blast radius is one lib rather than every dashboard.

`apps/web/src/app/pages/overview.ts` is the reference wiring — four charts in spartan cards as a
child route of `DashboardLayout`. It is demo data; delete it when starting a real project.


### Sharing the theme across apps

The design system is a lib, not an app file: `libs/frontend/ui/theme` (tagged
`platform:frontend,type:ui`) holds `index.css` (Tailwind layers + spartan preset), `tokens.css`
(the oklch tokens for light and `:root.dark`), `charts.css` (chart utilities + Unovis bridge), and
`base.css`. Each app's entry stylesheet is one import plus whatever is genuinely app-specific:

```css
/* apps/<app>/src/styles.css */
@import '../../../libs/frontend/ui/theme/src/index.css';
```

Two consequences worth knowing before adding `admin`:

- **Nx's graph does not follow CSS `@import`.** Without `"implicitDependencies": ["theme"]` in the
  app's `project.json`, a token change looks like it affects nothing and `nx affected` skips the
  rebuild. `web` declares it; every new app must too.
- **Tailwind scans the whole workspace** (source detection is rooted at the build's working
  directory), so it also scans markdown. Docs mentioning `bg-chart-1` were generating real
  utilities — `index.css` carries `@source not '**/*.md'` to keep prose out of the bundle.

The import is a relative path rather than a TypeScript alias because `tsconfig` paths do not apply
to CSS; `@import` resolution is filesystem- and node_modules-based.


### The admin app

`apps/admin` is a **SPA, not SSR**: everything behind it is authenticated, so prerendering buys
nothing and would only add the session-on-the-server problem described above. It serves on 4300 so
it can run alongside `web`.

It exists to keep the shared libs honest. It consumes `theme`, `dashboard-layout`, the card
components, and `charts` without a single change to any of them — the differences are all
app-level config:

- its own `SidebarConfig` provided for `DASHBOARD_MENU_CONFIG` (Operations / Platform /
  Configuration instead of the product nav);
- its own icons via `provideIcons` in `app.config.ts`. `provideIcons` merges down the injector
  hierarchy, so an app can supply icons the shared layout never imported — without that, the
  layout lib would have to grow an import for every icon any app might use.

That second point is the kind of coupling a second app is supposed to expose, and it resolves
cleanly. Adding a third app is now: generate, point `styles.css` at the theme lib, add
`implicitDependencies: ["theme"]`, provide a menu config and icons.


---

## 7b. Roles and permissions

Global roles (a user is an admin of the app, not of an org), permissions carried in the JWT, and
all mutations behind the API. Files: `supabase/migrations/20260810000000_rbac.sql`,
`supabase/seed.sql`, `libs/shared/domain`, `libs/frontend/data-access/supabase`,
`libs/backend/{core,supabase,user-management}`, `libs/frontend/features/user-management/*`.

### The model

```
auth.users ──1:n── user_roles ──n:1── app_role enum
                                          │
                          role_permissions │ (seeded map)
                                          ▼
                                   app_permission enum

sign in → custom_access_token_hook reads both tables
        → stamps { app_roles, app_permissions } into the JWT
        → RLS calls authorize('users.read'), which reads the claim (no join)
```

`authorize()` reads the claim off `auth.jwt()`, so a policy check costs nothing per row. The
alternative — a `SECURITY DEFINER` lookup per policy evaluation — is always fresh but pays a query
every time; this workspace chose claims.

**The trade-off you must design around: claims are as old as the token.** A revoked permission
survives until the next refresh (~1h by default). Two mitigations are in place: `AuthStore.refreshClaims()`
pulls a new token on demand, and disabling a user calls `auth.admin.signOut(userId, 'global')`, which
ends live sessions rather than waiting them out. For anything where staleness is unacceptable, add a
`SECURITY DEFINER` check to that specific policy.

### Where enforcement lives

Three layers, and only two of them are security:

| Layer | Mechanism | Is it a security boundary? |
| --- | --- | --- |
| Database | RLS policies calling `authorize()` | **Yes** — the last line, always applied |
| API | `SupabaseAuthGuard` + `@RequirePermissions` | **Yes** — verifies the JWT, checks permissions |
| UI | `permissionGuard`, `*libHasPermission` | **No** — decides what renders, nothing more |

`user_roles` has **no client write policy at all**. Not a restrictive one — none. Privilege
escalation is not expressible from a browser, because there is no code path from the anon key to a
write on that table. Grants happen in `libs/backend/user-management`, which holds the service_role
key and writes a `role_audit_log` row for every change.

Two guards worth keeping when you extend this: `revokeRole` refuses to remove the last admin (or
the workspace locks itself out of role management), and `grantRole` treats a duplicate as success
rather than an error, so retries are safe.

### Adding a permission

1. Add the value to the `app_permission` enum in a new migration.
2. Grant it to roles in `role_permissions` (migration or seed).
3. Regenerate types: `npx supabase gen types typescript --local > libs/shared/database-types/src/lib/database.types.ts`.
4. `APP_PERMISSIONS` in `libs/shared/domain` derives from the generated enum, so anything that
   needs updating now fails to compile.
5. Existing sessions pick it up on token refresh.

### Bootstrapping

Roles are service_role-only, so the first admin cannot be granted through the app. `supabase/seed.sql`
carries the SQL: insert the grant directly, then sign out and back in so the claim lands in the token.


---

## 7c. Notifications

In-app notification center plus toasts. Producers are server-side; delivery is Supabase Realtime.

```
API (service_role) ──insert──► notifications ──Realtime (RLS-filtered)──► NotificationsStore
   role granted / revoked                                                      │
   user invited / disabled                                        bell badge ──┴── toast on arrival
```

**Why the API writes them.** `notifications` has no client insert policy, so a browser cannot
notify another user — the same reasoning as `user_roles`. The user-management service calls
`NotificationService.notify()` from the hooks that already audit each privilege change, so real
events drive the feature rather than seeded rows.

**Reads and marking read go straight to Supabase.** Both are the caller's own rows under RLS, so
routing them through the API would add a hop and no safety. That is the Supabase-first rule from §2
applied concretely: the API earns its place only where a secret or a cross-user concern exists.

**A failed notification never fails its trigger.** `NotificationService` logs insert errors instead
of throwing — losing a bell badge is not worth rolling back a role grant. There is a test for it.

### Layering, and why the bell lives where it does

`NotificationsStore` is `type:data-access` and may not depend on a UI lib, so it cannot raise a
toast itself. It exposes `lastArrival`, and `NotificationBell` (`type:feature`) bridges that signal
to `ToastService` (`libs/frontend/ui/toast`, `type:ui`). The boundary rules pushed the coupling to
the right layer rather than blocking the feature.

The bell reaches the dashboard header through `DASHBOARD_HEADER_ACTIONS`, an injection token the
layout renders with `NgComponentOutlet`. A routed component has no parent template to project into,
and hard-wiring the bell into the layout would force every app to have Supabase configured — `web`
does not.

### Degrading without configuration

Mounting the bell subscribes to Realtime on construction, which throws when no anon key is set —
that took the whole admin shell down until `apps/admin/src/app/app.config.ts` started gating
Supabase-dependent features behind `isSupabaseConfigured(...)`. A freshly cloned starter boots and
shows the demo dashboard; the bell, the Notifications nav entry, and the pages that need a backend
appear once credentials exist. Follow that pattern for any future feature that needs a session at
construction time.


---

## 7d. Auth pages

One set of screens, mounted by every app: login, signup, forgot-password, reset-password, the
OAuth/email callback, and a setup page. Files: `libs/frontend/features/auth/feature`, with chrome
from `libs/frontend/layouts/auth-layout`.

```ts
// apps/<app>/src/app/app.routes.ts
{ path: 'auth', component: AuthContainer, children: authRoutes }

// apps/<app>/src/app/app.config.ts
provideAuthPages({ appName: 'Admin', redirectAfterLogin: '/', signupEnabled: false, oauthProviders: [] })
```

**Chrome is a layout, screens are a feature, the app composes them.** `AuthContainer` holds only the
centered column; the pages hold the forms and talk to `AuthStore`. That split exists because
`type:layout` may not depend on `type:data-access` — putting the forms in the layout would have
forced the boundary open. The app, being `type:app`, may import both, so composition happens there.

**Behaviour is config, not forks.** `AUTH_PAGES_CONFIG` carries the app name, post-login redirect,
whether self-signup is offered, and which OAuth providers to show. `admin` sets
`signupEnabled: false` (invite-only, per §7b) and `web` leaves it on — the same components render
both, with no per-app copies to keep in sync.

### Route guards

`libs/frontend/data-access/supabase` exports four guards. Apps wire them; nothing else decides
who gets in.

```ts
// the whole dashboard shell, in one place
{ path: '', component: DashboardLayout, canActivate: [authenticatedGuard], children: [...] }
```

- **`authenticatedGuard`** — signed out, you land on `/auth/login?returnUrl=<where you were>`, and
  login sends you back there afterwards.
- **`guestGuard`** — signed in, login and signup bounce you to `AUTH_NAVIGATION.afterLoginPath`. It
  is on those two routes only: `reset-password` runs *with* the recovery session, and `callback`
  runs while the sign-in is completing, so guarding either would lock the user out mid-flow.
- **`permissionGuard(...perms)`** — signed in plus every listed permission, else `/forbidden`.
- **`supabaseConfiguredGuard(setupPath?)`** — see below.

Paths are not hardcoded per guard: `AUTH_NAVIGATION` (a root `InjectionToken`) carries `loginPath`,
`forbiddenPath`, and `afterLoginPath`, defaulting to `/auth/login`, `/forbidden`, `/`. Override it
in `app.config.ts` if an app mounts the auth screens somewhere other than `/auth`.

**These guards are UX, not security.** They pick what renders. RLS and the API's
`@RequirePermissions` decide what data anyone can actually reach — see §7b.

### Details that are easy to get wrong

- **Wait for session restoration.** `getSession()` is asynchronous, so `isAuthenticated()` is still
  false for the first few milliseconds after boot. Every guard here awaits `AuthStore.loading`
  falling to `false` before deciding; reading the signal synchronously bounces a signed-in user to
  the login page on every hard refresh. This is the single most common way these guards go wrong.
- **`returnUrl` is validated before use.** `login-page` accepts it only when it starts with a single
  `/` — a full URL or `//evil.example` would turn the login screen into an open redirect. OAuth
  carries it through the provider round-trip on the `/auth/callback` query string.
- **No credentials means no enforcement.** When `supabaseUrl`/`supabaseAnonKey` are unset,
  `authenticatedGuard` and `permissionGuard` return `true` (with a dev-mode console warning) so a
  freshly cloned starter is still navigable — there is no session to check and no data to protect.
  Auth turns on the moment a real anon key is set.
- **Auth routes must not be prerendered.** `apps/web/src/app/app.routes.server.ts` gives `auth/**`
  `RenderMode.Client`: prerendering would ship a logged-out shell to everyone, and the Supabase
  client stores its session in `localStorage`, which does not exist on the server.
- **The callback route handles every redirect** — OAuth, email confirmation, and recovery — by
  exchanging `code` for a session. Recovery links are forwarded to `reset-password` rather than the
  app, otherwise the user lands signed in with no way to set a password.
- **Enumeration.** Forgot-password always shows the same confirmation, and signup never says an
  address is taken. Supabase's own errors are surfaced verbatim on login precisely because it does
  not distinguish unknown-email from wrong-password.
- **No credentials, no crash.** `supabaseConfiguredGuard()` diverts to `/auth/setup`, which explains
  how to start Supabase and where to paste the anon key, instead of letting a page construct a
  client and throw.

## 8. Shared contracts and generated types

```sh
# after every migration
npx supabase gen types typescript --local \
  > libs/shared/database-types/src/lib/database.types.ts
```

- `libs/shared/database-types` — generated, never hand-edited. Both the Angular Supabase client
  (`createClient<Database>`) and the Nest service-role client are typed from it.
- `libs/shared/domain` — hand-written zod schemas + inferred types for API payloads and email
  props. This is the FE↔BE contract; changing it breaks both sides at compile time, which is the
  point.
- Keep generated DB row types and API DTOs separate. Leaking `Database['public']['Tables'][...]`
  into API payloads couples your public contract to your schema.

---

## 9. Scaffolding

Because the point of the starter is speed, keep these commands in the repo rather than in
people's heads. Generate a **domain triad** for a new feature:

```sh
# smart/routed
npx nx g @nx/angular:library --directory=libs/frontend/features/billing/feature \
  --name=billing-feature --importPath=@kuetelabs/frontend/features/billing/feature \
  --tags=platform:frontend,type:feature,scope:billing --prefix=lib --unitTestRunner=vitest

# state + I/O
npx nx g @nx/angular:library --directory=libs/frontend/features/billing/data-access \
  --name=billing-data-access --importPath=@kuetelabs/frontend/features/billing/data-access \
  --tags=platform:frontend,type:data-access,scope:billing --prefix=lib --unitTestRunner=vitest

# presentational
npx nx g @nx/angular:library --directory=libs/frontend/features/billing/ui \
  --name=billing-ui --importPath=@kuetelabs/frontend/features/billing/ui \
  --tags=platform:frontend,type:ui,scope:billing --prefix=lib --unitTestRunner=vitest

# backend counterpart
npx nx g @nx/nest:library --directory=libs/backend/billing/feature --name=billing-feature \
  --importPath=@kuetelabs/backend/billing/feature \
  --tags=platform:backend,type:feature,scope:billing --unitTestRunner=jest

# shared contract
npx nx g @nx/js:library --directory=libs/shared/domain/billing --name=domain-billing \
  --importPath=@kuetelabs/shared/domain/billing \
  --tags=platform:shared,type:util,scope:billing --bundler=none --unitTestRunner=vitest
```

Five commands with tags that must not be mistyped is exactly the case for a workspace generator:
`tools/generators/feature` taking `--domain` and emitting all five with correct tags, import paths,
and a registered lazy route. Building it is the highest-leverage hour in this repo.

spartan components keep their own generator, which reads `components.json`:

```sh
npx nx g @spartan-ng/cli:ui --name=<component>      # add one component
npx nx g @spartan-ng/cli:ui --name=all              # add all
npx nx g @spartan-ng/cli:healthcheck                # diagnose after upgrades
```

---

## 10. Conventions

- **Files:** modern Angular style, already used here — `login-form.ts`, `sidebar.service.ts`,
  `dashboard-layout.ts`. No `.component.ts` suffix; class names carry the role (`DashboardLayout`,
  `SidebarService`).
- **Selectors:** `hlm` for vendored components, `lib` for layout/feature libs, `app` for app-level
  components. Each lib's `eslint.config.mjs` enforces its prefix.
- **Barrels:** every lib exports through `src/index.ts`; cross-lib imports use the
  `@kuetelabs/...` alias, intra-lib imports use relative paths. Never deep-import past a barrel.
- **Config over forking:** layouts take their data through injection tokens
  (`DASHBOARD_MENU_CONFIG` is the model to copy) so a new project changes a config object rather
  than editing the layout lib.
- **Theme:** all design tokens live in the app's `styles.css` (oklch variables + the spartan
  preset). Component libs never hardcode colours; they consume `bg-primary`, `text-muted-foreground`,
  etc. Re-theming a new project = editing one file.

---

## 11. Testing and CI

| Layer | Runner | Notes |
| --- | --- | --- |
| Angular apps + libs | vitest (`@angular/build:unit-test`) | `--unitTestRunner=vitest` on new libs; the vendored spartan libs stay untested — they are upstream code |
| NestJS | jest (`@nx/jest`) | Unit-test services; controllers via e2e |
| Frontend e2e | Playwright | `web-e2e` and `admin-e2e` were deleted in the current working tree — regenerate them |
| Database | pgTAP / Supabase tests | **RLS policies must have tests.** With Supabase-first, an untested policy is an unguarded API |

`tools/screenshot.mjs` renders routes in light and dark through Playwright (`node
tools/screenshot.mjs /route --theme both`) and exits non-zero on an uncaught page error. Reach for
it whenever a change is visual: the chart work here shipped two defects — a white dark-mode grid
and half-labeled axes — that compiled, linted, and prerendered cleanly. Browsers come from
`npx playwright install chromium`; Ubuntu 26.04 needs Playwright >= 1.62.

CI runs `npx nx affected -t lint test build` (plus `supabase db lint`). No GitHub workflow exists
yet — `npx nx g ci-workflow` generates one.

---

## 12. Config and secrets

| Value | Where | Exposure |
| --- | --- | --- |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Angular environments | Public by design — safe only because RLS is on |
| `SUPABASE_SERVICE_ROLE_KEY` | `apps/api` env only | Never in any frontend or shared lib |
| `RESEND_API_KEY` | `apps/api` env only | Never in any frontend or shared lib |
| `API_URL`, `APP_NAME` | Angular environments | Public |

`apps/web/src/environments/environment.ts` reads `process.env` at **build** time. Values therefore
bake into the bundle: one build per environment, or fetch runtime config from the SSR server for
values that must vary per deploy. Keep `.env.example` current — it is the contract for a new clone.

---

## 13. Using this repo to start a new project

1. Clone, then rename the npm scope: `@kuetelabs/*` → `@<project>/*` in `tsconfig.base.json`,
   `components.json` (`importAlias`), and every lib `package.json`.
2. `supabase/config.toml` → new `project_id`; copy `.env.example` to `.env`.
3. Delete the feature libs you don't need (each is one folder + one route entry).
4. Re-theme: edit `libs/frontend/ui/theme/src/tokens.css` — one file re-skins every app.
5. Point the dashboard at your navigation by editing the `SidebarConfig` object provided for
   `DASHBOARD_MENU_CONFIG` in `app.config.ts`.
6. `npx nx run-many -t lint test build` — green means the clone is sound.

---

## 14. Migration plan from today's state

Ordered by leverage. Items 1–2 are done; the rest are open.

| # | Step | Status |
| --- | --- | --- |
| 1 | Repoint stale `@kuetelabs/components/*` and `@kuetelabs/layouts/*` imports at `@kuetelabs/frontend/...` | **done** |
| 2 | Fix layout libs' `sourceRoot`, `$schema` depth, base-eslint import depth; add `platform:frontend` tags | **done** |
| 3 | Add the `platform:*` and remaining `type:*` `depConstraints` from §4 | **done** |
| 4 | Create `libs/shared/database-types` + `libs/shared/domain`; wire `supabase gen types` | **done** (types hand-written until the local stack runs) |
| 5 | Create `libs/frontend/data-access/supabase` (provider, `AuthStore`, guards); wire the auth screens to it | **done** (§7d) |
| 6 | Split `app.routes.server.ts` render modes (§5) | **done** for `auth/**`; the dashboard shell is still prerendered |
| 7 | Restructure `apps/api`: `libs/backend/core` + `libs/backend/supabase`, `AppModule` as composition root | **done** |
| 8 | Add `libs/backend/email` with Resend + React Email templates | open |
| 9 | Add `admin` app + `admin-e2e` | **done** |
| 9b | Regenerate the deleted `web-e2e` / `api-e2e` | open |
| 15 | RBAC: schema, RLS, JWT hook, admin API, admin UI (§7b) | **done — unexecuted against a live database** |
| 16 | Run `supabase start` + `db reset`, regenerate DB types, add pgTAP policy tests | open |
| 17 | Notifications: table + RLS + Realtime, API producers, bell, toasts (§7c) | **done — unexecuted against a live database** |
| 10 | Write `tools/generators/feature` to emit the §9 triad | open |
| 11 | `npx nx g ci-workflow`; add RLS policy tests to CI | open |
| 12 | Charts: `angular-chrts` installed, `--chart-*` tokens + Unovis bridge wired (§7a) | **done** |
| 14 | Move the design system into `libs/frontend/ui/theme`; apps import it (§7a) | **done** |
| 13 | Wrap charts in `libs/frontend/ui/charts` (SSR guard + themed defaults) so features never import `angular-chrts` directly | **done** |
