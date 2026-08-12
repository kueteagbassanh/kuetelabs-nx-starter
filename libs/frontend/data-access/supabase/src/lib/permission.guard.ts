import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import type { AppPermission } from '@kuetelabs/shared/domain';
import { AuthStore } from './auth.store';

/**
 * Route guard for a required permission.
 *
 * This is a UI affordance, not a security control — it stops a user landing on a
 * page they cannot use. The data behind that page is protected by RLS and the API.
 */
export function permissionGuard(...required: AppPermission[]): CanActivateFn {
  return async () => {
    const auth = inject(AuthStore);
    const router = inject(Router);

    if (auth.loading()) {
      await auth.refreshClaims();
    }

    if (!auth.isAuthenticated()) {
      return router.createUrlTree(['/auth/login']);
    }

    return required.every((permission) => auth.has(permission))
      ? true
      : router.createUrlTree(['/forbidden']);
  };
}

/** Guard for "signed in", with no permission requirement. */
export const authenticatedGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/auth/login']);
};
