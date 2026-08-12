import type { Routes } from '@angular/router';
import { authenticatedGuard } from '@kuetelabs/frontend/data-access/supabase';

/** Mount with `loadChildren: () => import('...').then(m => m.notificationRoutes)`. */
export const notificationRoutes: Routes = [
  {
    path: '',
    canActivate: [authenticatedGuard],
    loadComponent: () => import('./pages/notification-list').then((m) => m.NotificationList),
  },
];
