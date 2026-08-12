import { Route } from '@angular/router';
import { AuthContainer } from '@kuetelabs/frontend/layouts/auth-layout';
import { authRoutes } from '@kuetelabs/frontend/features/auth/feature';
import { authenticatedGuard } from '@kuetelabs/frontend/data-access/supabase';
import { DashboardLayout } from '@kuetelabs/frontend/layouts/dashboard-layout';
import { DocsLayout } from '@kuetelabs/frontend/layouts/docs-layout';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    component: AuthContainer,
    children: authRoutes,
  },
  {
    // Public docs, mounted before the '' dashboard route below — that one
    // prefix-matches everything. The tree comes from provideDocsLayout().
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
    // Everything behind the dashboard requires a session.
    path: '',
    component: DashboardLayout,
    canActivate: [authenticatedGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/overview').then((m) => m.Overview),
      },
    ],
  },
];
