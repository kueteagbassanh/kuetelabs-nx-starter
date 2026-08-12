# landing-layout

The public marketing shell: announcement bar, sticky header, `<router-outlet />`,
a closing call-to-action band, and the footer. Pages supply only their own
content — every word of the chrome comes from a config object the app provides,
the same split as `DASHBOARD_MENU_CONFIG` in `dashboard-layout`.

## Using it

Provide the config once, then mount the layout as a routed component:

```ts
// app.config.ts
import { provideLandingLayout } from '@kuetelabs/frontend/layouts/landing-layout';
import { landingConfig } from './landing.config';

providers: [
  provideLandingLayout(landingConfig),
  // Needed for the header's `/#pricing` style links:
  provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
];
```

```ts
// app.routes.ts
{
  path: '',
  component: LandingLayout,
  children: [
    { path: '', loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing) },
    { path: 'contact', loadComponent: () => import('./pages/contact').then((m) => m.Contact) },
  ],
}
```

`apps/web/src/app/landing.config.ts` is a filled-in example of every field.

## The config

`LandingConfig` (see `landing.model.ts`) is the whole API:

| Field | Renders |
| --- | --- |
| `brand` | Logo box and wordmark in the header and footer |
| `nav` | Header links — desktop row and mobile drawer |
| `actions` | Header buttons; `desktopOnly` moves one into the drawer below `sm` |
| `announcement` | Dismissible strip above the header; omit to render nothing |
| `cta` | Pre-footer conversion band, on every page of the layout |
| `footer` | Description, link columns, socials, newsletter, legal strip |

A `LandingLink` is a router link by default. Add `fragment` for an on-page
anchor, or `external: true` for an `<a href target="_blank">` with an
out-arrow icon.

Icons are strings, so the layout has to register them up front: `brand.icon`
must be a key of `LANDING_BRAND_ICONS` and `footer.socials[].icon` a key of
`LANDING_SOCIAL_ICONS` (`landing-icons.ts`). Add new ones there, not in the app.

## Components

| Export | Role |
| --- | --- |
| `LandingLayout` | The shell; composes everything below |
| `LandingLayoutHeader` / `LandingLayoutFooter` | Chrome, driven entirely by the config |
| `LandingAnnouncementBar` | Dismissal is remembered per browser under `announcement.id` |
| `LandingCta` | The pre-footer band |
| `LandingNavLink` | The one place that knows router link vs. fragment vs. external |
| `LandingSection` | **Used by pages**: the vertical rhythm of every section |
| `ThemeToggle` / `ThemeStore` | Light/dark switch, persisted in `localStorage` |

### LandingSection

Pages should not hand-roll a `<section>`; wrap content in this instead so
padding, max width, and heading styles cannot drift:

```html
<lib-landing-section id="pricing" eyebrow="Pricing" heading="…" description="…" [muted]="true">
  <!-- content -->
</lib-landing-section>
```

`id` on the host makes it an anchor target — the host carries `scroll-mt` so the
sticky header does not cover it. `muted` tints the band for alternating zones.
Headings render as `h2`, because the page's `h1` belongs to its hero; a page
without a hero (`/contact`) sets `[headingLevel]="1"` so it still has exactly
one `h1`.

## Dark mode

`ThemeStore` is a SignalStore holding `'light' | 'dark' | 'system'`, persisted
under `kuetelabs-theme`, and toggles `.dark` on `<html>`. Because that element
is outside Angular's control, add the anti-FOUC script from
`apps/web/src/index.html` to any app that uses this layout — without it, a
dark-mode visitor sees a white flash before hydration.

Everything browser-only here is hydration-safe: the theme class is applied
before bootstrap, the toggle swaps icons with CSS rather than by changing the
DOM, and the announcement bar reads its stored dismissal in `afterNextRender`.
