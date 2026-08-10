import { Route } from '@angular/router';
import { DashboardLayout } from '@kuetelabs/frontend/layouts/dashboard-layout';

export const appRoutes: Route[] = [
  {
    path: '',
    component: DashboardLayout,
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/overview').then((m) => m.Overview),
      },
    ],
  },
];
