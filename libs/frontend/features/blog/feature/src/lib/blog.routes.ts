import type { Routes } from '@angular/router';
import { permissionGuard } from '@kuetelabs/frontend/data-access/supabase';

/**
 * The public blog. Mount inside the marketing shell:
 * `{ path: 'blog', children: blogRoutes }`.
 *
 * No guard: published posts are readable by anonymous visitors, which is what the
 * RLS policy says too. `:slug` needs `withComponentInputBinding()` in the app's
 * router config — both apps here have it.
 */
export const blogRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/blog-list').then((m) => m.BlogList),
  },
  {
    path: ':slug',
    loadComponent: () => import('./pages/blog-post').then((m) => m.BlogPost),
  },
];

/**
 * The authoring screens, for the dashboard shell:
 * `{ path: 'blog', children: blogAdminRoutes }`.
 *
 * The guards keep authors off pages they cannot use; they are not the security
 * boundary — RLS and the API's @RequirePermissions are. `new` is declared before
 * `:id` or it would be read as a post id.
 */
export const blogAdminRoutes: Routes = [
  {
    path: '',
    canActivate: [permissionGuard('blog.read')],
    loadComponent: () => import('./pages/blog-admin-list').then((m) => m.BlogAdminList),
  },
  {
    path: 'new',
    canActivate: [permissionGuard('blog.write')],
    loadComponent: () => import('./pages/blog-editor').then((m) => m.BlogEditor),
  },
  {
    path: ':id',
    canActivate: [permissionGuard('blog.write')],
    loadComponent: () => import('./pages/blog-editor').then((m) => m.BlogEditor),
  },
];
