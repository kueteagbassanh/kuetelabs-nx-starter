import { Route } from '@angular/router';
import { DashboardLayout } from '@kuetelabs/frontend/layouts/dashboard-layout';
import { LandingLayout } from '@kuetelabs/frontend/layouts/landing-layout';

/**
 * `web` is the public site: the marketing shell owns `/`, and the signed-in
 * dashboard moved to `/dashboard` — which is where `dashboardMenu` in
 * `app.config.ts` already pointed.
 */
export const appRoutes: Route[] = [
  {
    path: '',
    component: LandingLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/landing/landing').then((m) => m.Landing),
      },
      {
        path: 'contact',
        loadComponent: () => import('./pages/contact').then((m) => m.Contact),
      },
    ],
  },
  {
    path: 'dashboard',
    component: DashboardLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/overview').then((m) => m.Overview),
      },
    ],
  },
];
