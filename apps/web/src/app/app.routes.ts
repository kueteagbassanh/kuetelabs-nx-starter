import { Route } from '@angular/router';
import { AuthContainer } from '@kuetelabs/frontend/layouts/auth-layout';
import { authRoutes } from '@kuetelabs/frontend/features/auth/feature';
import { authenticatedGuard } from '@kuetelabs/frontend/data-access/supabase';
import { DashboardLayout } from '@kuetelabs/frontend/layouts/dashboard-layout';
import { DocsLayout } from '@kuetelabs/frontend/layouts/docs-layout';
import { ErrorPage, errorRoutes, notFoundRoute } from '@kuetelabs/frontend/layouts/error-layout';
import { LandingLayout } from '@kuetelabs/frontend/layouts/landing-layout';

/**
 * `web` is the public site: the marketing shell owns `/`, and the signed-in
 * dashboard moved to `/dashboard` — which is where `dashboardMenu` in
 * `app.config.ts` already pointed.
 */
export const appRoutes: Route[] = [
  {
    path: 'auth',
    component: AuthContainer,
    children: authRoutes,
  },
  {
    // Full-screen error screens anyone can reach — an HTTP interceptor sends the
    // user here without knowing whether they have a session. Declared before the
    // '' shell below, which prefix-matches every URL.
    path: 'error',
    children: errorRoutes,
  },
  {
    // Public docs. Mounted before the '' landing shell, which prefix-matches
    // every URL; the tree comes from provideDocsLayout().
    path: 'docs',
    component: DocsLayout,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'introduction' },
      {
        path: 'introduction',
        loadComponent: () =>
          import('./pages/docs/introduction').then((m) => m.DocsIntroduction),
      },
      {
        path: 'installation',
        loadComponent: () =>
          import('./pages/docs/installation').then((m) => m.DocsInstallation),
      },
    ],
  },
  {
    path: '',
    component: LandingLayout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/landing/landing').then((m) => m.Landing),
      },
      {
        path: 'contact',
        loadComponent: () => import('./pages/contact').then((m) => m.Contact),
      },
    ],
  },
  {
    // Everything behind the dashboard requires a session.
    path: 'dashboard',
    component: DashboardLayout,
    canActivate: [authenticatedGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/overview').then((m) => m.Overview),
      },
      {
        // AUTH_NAVIGATION.forbiddenPath. Inside the shell on purpose: a signed-in
        // user who lacks one permission keeps the navigation they can still use.
        path: 'forbidden',
        component: ErrorPage,
        data: { code: 403, inline: true },
      },
    ],
  },
  // Last: anything unmatched is a 404, rendered at the URL that was requested so
  // the address bar still shows the broken link.
  notFoundRoute(),
];
