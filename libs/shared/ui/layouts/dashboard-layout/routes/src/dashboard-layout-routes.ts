import { Routes } from '@angular/router';

export const dashboardLayoutRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('@kuetelabs/layouts/dashboard-layout/ui').then(
        (m) => m.DashboardLayoutUi,
      ),
  },
];
