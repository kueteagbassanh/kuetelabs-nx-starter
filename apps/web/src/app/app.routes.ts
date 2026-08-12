import { Route } from '@angular/router';
import { AuthContainer } from '@kuetelabs/frontend/layouts/auth-layout';
import { authRoutes } from '@kuetelabs/frontend/features/auth/feature';
import { authenticatedGuard } from '@kuetelabs/frontend/data-access/supabase';
import { DashboardLayout } from '@kuetelabs/frontend/layouts/dashboard-layout';
import { ErrorPage, errorRoutes, notFoundRoute } from '@kuetelabs/frontend/layouts/error-layout';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    component: AuthContainer,
    children: authRoutes,
  },
  {
    // Full-screen error screens anyone can reach — an HTTP interceptor sends the
    // user here without knowing whether they have a session. Declared before the
    // dashboard because the '' path below prefix-matches every URL.
    path: 'error',
    children: errorRoutes,
  },
  {
    // Everything behind the dashboard requires a session.
    path: '',
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
