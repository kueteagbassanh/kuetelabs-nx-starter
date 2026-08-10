import type { Routes } from '@angular/router';
import { permissionGuard } from '@kuetelabs/frontend/data-access/supabase';

/**
 * Mount with `loadChildren: () => import('...').then(m => m.userManagementRoutes)`.
 *
 * The guards keep users off pages they cannot use; they are not the security
 * boundary — RLS and the API's @RequirePermissions are.
 */
export const userManagementRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('users.read')],
    loadComponent: () => import('./pages/user-list').then((m) => m.UserList),
  },
  {
    path: 'roles',
    canActivate: [permissionGuard('roles.read')],
    loadComponent: () => import('./pages/role-matrix').then((m) => m.RoleMatrix),
  },
];
