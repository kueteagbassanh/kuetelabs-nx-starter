import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadChildren: () =>
      import('@kuetelabs/layouts/dashboard-layout/routes').then(
        (m) => m.dashboardLayoutRoutes,
      ),
  },
];
