import type { Route, Routes } from '@angular/router';
import { ErrorPage } from './error-page';
import { ERROR_CODES } from './error.catalog';

export interface ErrorRoutesOptions {
  /**
   * Render the pages filling their parent rather than the viewport. Use this when
   * the routes are mounted as children of the dashboard shell.
   */
  inline?: boolean;
}

/**
 * One route per catalog entry, mounted by each app under its own path:
 *
 *   { path: 'error', children: errorRoutes }
 *
 * Generated from `ERROR_CATALOG` rather than hand-listed so a new status is a
 * single catalog entry. Every path is static, which matters for `apps/web`: the
 * SSR build can enumerate and prerender all of them, where a `:code` param route
 * would need `getPrerenderParams` in the app's server routes.
 */
export function createErrorRoutes(options: ErrorRoutesOptions = {}): Routes {
  const inline = options.inline ?? false;

  return [
    ...ERROR_CODES.filter((code) => code !== 'unknown').map(
      (code): Route => ({
        path: String(code),
        component: ErrorPage,
        data: { code, inline },
      }),
    ),
    // `/error` on its own, and any code with no entry of its own, get the generic
    // screen — never a blank outlet.
    { path: '**', component: ErrorPage, data: { code: 'unknown', inline } },
  ];
}

/** Ready-made full-screen error routes. */
export const errorRoutes: Routes = createErrorRoutes();

/**
 * The app-level catch-all. Goes last in `appRoutes`:
 *
 *   { path: '**', ...notFoundRoute() }
 *
 * Renders 404 at the URL the user actually typed instead of redirecting to
 * `/error/404`, so the address bar still shows the broken link they need to fix.
 */
export function notFoundRoute(options: ErrorRoutesOptions = {}): Route {
  return { path: '**', component: ErrorPage, data: { code: 404, inline: options.inline ?? false } };
}
