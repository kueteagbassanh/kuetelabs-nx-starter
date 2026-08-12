# error-layout

Every error screen the apps can show — 400, 401, 403, 404, 408, 410, 429, 500, 502,
503, 504, plus `offline`, `maintenance`, and a generic `unknown` fallback.

## Shape

One component renders all of them. The per-status difference is data:

| file | holds |
| --- | --- |
| `error.model.ts` | `ErrorCode`, `ErrorAction`, `ErrorDefinition` |
| `error.catalog.ts` | `ERROR_CATALOG` — copy, glyph, tone, and buttons per code |
| `error.config.ts` | `ERROR_PAGES_CONFIG` + `provideErrorPages()` |
| `error-container.ts` | the centered frame, projectable for bespoke screens |
| `error-page.ts` | `ErrorPage` — reads the catalog, renders, runs the actions |
| `error.routes.ts` | `errorRoutes`, `createErrorRoutes()`, `notFoundRoute()` |

Adding a status is one `ERROR_CATALOG` entry; the route is generated from the
catalog, so there is no second place to update.

## Mounting

```ts
export const appRoutes: Route[] = [
  { path: 'error', children: errorRoutes },
  // ...
  notFoundRoute(),
];
```

`errorRoutes` are full-screen. Pass `inline: true` — via `createErrorRoutes({ inline: true })`,
`notFoundRoute({ inline: true })`, or `data: { inline: true }` on a single route — when
the route sits inside the dashboard shell, where `min-h-svh` would give the content
area its own scrollbar. Both apps use that for `/forbidden`, so a signed-in user who
lacks a permission keeps the navigation they can still use.

`ErrorPage` takes `code` as a signal input, so with `withComponentInputBinding()` it
is fed by route `data: { code: 404 }` or by a route param. If an app prefers
`/error/:code`, that binds with no extra code — but keep in mind `apps/web` prerenders
these routes, and a param route would then need `getPrerenderParams` in
`app.routes.server.ts`. The static paths generated here need nothing.

## Config

```ts
provideErrorPages({
  appName: 'Admin',
  homePath: '/',
  loginPath: '/auth/login',   // mirror AUTH_NAVIGATION.loginPath
  supportUrl: 'https://status.example.com',
  catalog: { 500: { description: 'Our incident channel has already been paged.' } },
});
```

`loginPath` is duplicated rather than read from `AUTH_NAVIGATION` on purpose: this lib
imports nothing from `data-access`, so the error screens still render in an app with no
Supabase wiring at all — which is exactly the state an app is in when things are broken.

`support` actions disappear when `supportUrl` is unset, `back` disappears when there is
no history to go back to, and `retry` disappears on the server. Nothing renders a button
that cannot work.
