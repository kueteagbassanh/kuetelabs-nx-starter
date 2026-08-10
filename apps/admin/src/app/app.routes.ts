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
      {
        path: 'users',
        loadChildren: () =>
          import('@kuetelabs/frontend/features/user-management/feature').then(
            (m) => m.userManagementRoutes,
          ),
      },
      {
        path: 'forbidden',
        loadComponent: () => import('./pages/forbidden').then((m) => m.Forbidden),
      },
    ],
  },
];
