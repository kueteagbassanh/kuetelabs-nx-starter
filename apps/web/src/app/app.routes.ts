import { Route } from '@angular/router';
import { AuthContainer } from '@kuetelabs/frontend/layouts/auth-layout';
import { authRoutes } from '@kuetelabs/frontend/features/auth/feature';
import { DashboardLayout } from '@kuetelabs/frontend/layouts/dashboard-layout';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    component: AuthContainer,
    children: authRoutes,
  },
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
