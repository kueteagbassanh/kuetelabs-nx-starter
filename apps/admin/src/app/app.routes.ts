import { Route } from '@angular/router';
import { DashboardLayout } from '@kuetelabs/frontend/layouts/dashboard-layout';
// Static import: the header bell already pulls this lib into the initial bundle, so
// lazy-loading it here would only mix static and dynamic imports of one library.
// The page component inside notificationRoutes still code-splits via loadComponent.
import { notificationRoutes } from '@kuetelabs/frontend/features/notification/feature';

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
        path: 'notifications',
        children: notificationRoutes,
      },
      {
        path: 'forbidden',
        loadComponent: () => import('./pages/forbidden').then((m) => m.Forbidden),
      },
    ],
  },
];
