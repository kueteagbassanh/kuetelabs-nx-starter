# i18n

Runtime internationalisation for every Angular app in this workspace: a locale
store, a lazy translation loader, a language switcher, and the message files for
the shared chrome (auth pages, error screens).

```ts
// app.config.ts
...provideI18n({ defaultLocale: 'en' }),
```

```html
<!-- in a template -->
<h1 *transloco="let t">{{ t('auth.login.title', { app: name }) }}</h1>
```

Both are re-exported from `@kuetelabs/frontend/ui/i18n`; nothing outside this lib
should import `@jsverse/transloco` directly.

---

## Why Transloco and not `$localize`

Angular's built-in i18n is a *build-time* transform: one compiled bundle per
language. That is a poor fit here for two reasons. This workspace deploys a
single SSR server for `web` and a single SPA for `admin`, so per-locale builds
would multiply both the build matrix and the deployed artefacts. And the language
could only change with a full page load to a different origin or path.

Transloco resolves messages at runtime, so one build serves every language and
switching is instant.

## Where the locale comes from

**A cookie, not `localStorage`.** This is the single most important decision in
the lib and everything else follows from it.

`web` is server-rendered. For the first paint to survive hydration, the server
and the browser have to independently arrive at the *same* locale — if the server
renders English and the client decides on French before Angular claims the DOM,
the render is thrown away. `localStorage` is invisible to the server, so it can
never satisfy that. A cookie travels with the request and both sides can read it.

So `resolveInitialLocale()` consults the cookie and nothing else, on both
platforms:

| | source |
| --- | --- |
| Browser | `document.cookie` |
| SSR (real request) | the `Cookie:` header, via `REQUEST` |
| Prerender / route extraction | nothing — falls back to `defaultLocale` |

`navigator.language` is deliberately *not* part of that. The server cannot see
it, so consulting it before the first render would reintroduce exactly the
disagreement the cookie exists to prevent. Instead `LocaleStore`'s `onInit` hook
adopts it **after hydration**, and only when no cookie exists yet — by then the
DOM is stable, so it is just an ordinary language change, and it writes the
cookie so it never has to happen again.

> During prerendering `document.cookie` is not merely empty, it *throws*
> (`NotYetImplemented`) on Angular's server DOM shim, which fails the build. That
> is why the read is platform-gated rather than wrapped in a try/catch.

## Prerendered routes render in the default locale

`web` prerenders `/error/*` and the landing pages. A prerendered file is one
document served to everyone, so it cannot carry a visitor's language; those pages
ship in `defaultLocale` and switch to the visitor's language during hydration.
Structure does not change between languages, only text, so hydration is clean —
but a returning French visitor may see a brief English frame.

If that matters for a given route, give it `RenderMode.Server` in
`app.routes.server.ts` so it is rendered per request with the cookie in hand.

## How messages load

`LazyTranslationLoader` resolves messages from static `import()` calls rather
than over HTTP. Transloco's stock loader fetches `/assets/i18n/{lang}.json`,
which would cost three things:

- the JSON would have to be copied out of this lib into every app's `assets` glob;
- SSR would need an absolute URL to fetch its own origin;
- the payload would then have to be replayed to the client via `TransferState`
  to avoid downloading it twice.

A dynamic import has none of those problems, and the bundler still emits one lazy
chunk per locale — only the active language is ever downloaded.

`LocaleStore.setLocale()` calls `TranslocoService.load()` itself, and that is not
redundant: `setActiveLang()` only marks a language active, it does not fetch it.
The `*transloco` directive triggers its own load, so template-driven pages would
be fine either way — but a page whose copy comes from a catalog through
`injectCopyResolver()` has no directive, and would otherwise sit in the previous
language indefinitely after a switch.

### Adding a locale

1. Add the message file next to `en.json`.
2. Register it in `translations/index.ts`.
3. Add a `LocaleDefinition` in `locale.model.ts` (the `label` is the language's
   own name — a picker that renders every option in the *current* language is
   useless to someone who cannot read the current language).

A locale with a definition but no loader entry silently falls back; the spec in
`i18n.spec.ts` guards the opposite direction, failing if a key exists in English
but is missing from French.

### Adding messages from a feature or an app

`I18N_TRANSLATIONS` is multi-provided and merged deeply in registration order, so
a lib and the app consuming it can both contribute to the same namespace and the
app wins key by key:

```ts
...provideI18n({
  translations: [
    { loaders: { en: () => import('./i18n/en.json'), fr: () => import('./i18n/fr.json') } },
  ],
}),
```

Pass a `scope` to keep a feature's messages in their own lazily-loaded namespace.

## Who owns which messages

This lib ships the **shared chrome** — `common`, `auth`, `errors` — everything an
app gets without writing copy. An app's own words live in the app:
`apps/web/src/app/i18n/{en,fr}.json` holds the marketing surface (`landing.*`,
`contact.*`) and is registered through `provideI18n({ translations: [...] })`.
The two are deep-merged, so an app can also override a single chrome key without
restating the file.

## Translating data, not templates

Templates use `*transloco`. Catalogs and config objects hold plain strings that a
pipe cannot reach, so those go through `injectCopyResolver()`:

```ts
private readonly copy = injectCopyResolver();
readonly title = computed(() => this.copy()('errors.404.title', 'Page not found'));
```

The second argument is a fallback, used when the key is missing **or when the app
never called `provideI18n()` at all**. That second case is why `I18N_ENABLED`
exists: `error-layout` has to render in an app with nothing configured, and
`TranslocoService` cannot be probed with `{ optional: true }` — it is
`providedIn: 'root'`, but its transpiler and missing-handler dependencies are
not, so injecting it in an unconfigured app throws rather than returning null.

`ErrorPage` is the reference consumer. Its precedence is: built-in English, then
the translation, then an explicit `provideErrorPages({ catalog })` override —
an app that hard-codes copy means it, so that outranks the translation.

`landing-layout` uses the same resolver for a different reason: `landingConfig`
stores **translation keys** (`'landing.nav.features'`) where it used to store
sentences, and the fallback is what still lets an app put a literal there and
have it render unchanged. `LandingNavLink` is the choke point — every nav,
footer, legal and announcement label passes through it, so translating there
covers all of them at once.

Two shapes need care:

- **Lists.** Keep ids in the component (`{ id: 'auth', icon: … }`) and resolve
  `t('landing.features.items.' + id + '.title')`. Do not put an array of
  sentences in the JSON: Transloco flattens nested objects, so an array value is
  not reliably retrievable through the directive.
- **Copy a component renders outside its template.** `LandingHero`'s chart series
  labels are drawn by the chart itself, so they are a `computed` over the
  resolver rather than a template binding, and re-resolve on a language change.

## Testing

`provideI18nTesting()` mirrors `provideI18n()` without the app initializer, since
`TestBed` does not run one. Await messages explicitly:

```ts
TestBed.configureTestingModule({
  providers: [provideI18nTesting({ translations: CHROME_TRANSLATIONS })],
});
await loadI18n(TestBed.inject(TranslocoService));
```

`setLocale()` writes a real cookie and jsdom keeps one document per file, so
clear it between tests that assert on the initial locale.

## Layering

Tagged `type:ui`, which is deliberate: `type:layout`, `type:feature` and apps may
all depend on `type:ui`, so this is the only layer reachable from everywhere the
chrome lives. It follows that the lib must never import `data-access` — the error
screens have to render with Supabase missing or broken.

The consequence: persisting a locale onto a **user profile** does not belong
here. Keep this lib's cookie as the source of truth for rendering, and put any
profile sync in a feature lib that calls `LocaleStore.setLocale()`.
