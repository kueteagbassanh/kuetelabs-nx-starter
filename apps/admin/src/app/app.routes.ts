import { Route } from '@angular/router';
import { AuthContainer } from '@kuetelabs/frontend/layouts/auth-layout';
import { authRoutes } from '@kuetelabs/frontend/features/auth/feature';
import { authenticatedGuard } from '@kuetelabs/frontend/data-access/supabase';
import { DashboardLayout } from '@kuetelabs/frontend/layouts/dashboard-layout';
// Static import: the header bell already pulls this lib into the initial bundle, so
// lazy-loading it here would only mix static and dynamic imports of one library.
// The page component inside notificationRoutes still code-splits via loadComponent.
import { notificationRoutes } from '@kuetelabs/frontend/features/notification/feature';

export const appRoutes: Route[] = [
  {
    // Chrome from the layout lib, screens from the feature lib, composed here.
    path: 'auth',
    component: AuthContainer,
    children: authRoutes,
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
