import { InjectionToken, Injector, type Signal, inject, isDevMode } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, type CanActivateFn } from '@angular/router';
import { filter, firstValueFrom } from 'rxjs';
import type { AppPermission } from '@kuetelabs/shared/domain';
import { AuthStore } from './auth.store';
import { SUPABASE_CONFIG, isSupabaseConfigured } from './supabase.config';

export interface AuthNavigation {
  /** Where to send signed-out users. */
  loginPath: string;
  /** Where to send signed-in users who lack a permission. */
  forbiddenPath: string;
  /** Where to send signed-in users who land on login or signup. */
  afterLoginPath: string;
}

/** Override per app if the auth screens are mounted somewhere other than /auth. */
export const AUTH_NAVIGATION = new InjectionToken<AuthNavigation>('AUTH_NAVIGATION', {
  providedIn: 'root',
  factory: () => ({
    loginPath: '/auth/login',
    forbiddenPath: '/forbidden',
    afterLoginPath: '/',
  }),
});

/**
 * Waits for the initial `getSession()` to resolve.
 *
 * Without this, a hard refresh bounces a signed-in user to the login page: session
 * restoration is asynchronous, so `isAuthenticated()` is still false for the first
 * few milliseconds after boot. Checking it synchronously is the single most common
 * way these guards go wrong.
 */
async function sessionRestored(loading: Signal<boolean>, injector: Injector): Promise<void> {
  if (!loading()) {
    return;
  }
  await firstValueFrom(toObservable(loading, { injector }).pipe(filter((value) => !value)));
}

function authDisabled(): boolean {
  if (isDevMode()) {
    console.warn(
      '[auth] Supabase is not configured, so route guards are not enforcing anything. ' +
        'Set supabaseUrl / supabaseAnonKey in the app environment to turn auth on.',
    );
  }
  return true;
}

/**
 * Requires a signed-in user, and remembers where they were going.
 *
 * A UI affordance, not a security control: RLS and the API's @RequirePermissions
 * decide what data anyone can actually reach.
 */
export const authenticatedGuard: CanActivateFn = async (_route, state) => {
  const injector = inject(Injector);
  const router = inject(Router);
  const nav = inject(AUTH_NAVIGATION);
  const config = inject(SUPABASE_CONFIG, { optional: true });

  // With no credentials there is no session to check and no data to protect — let
  // the route through so a freshly cloned starter is still navigable.
  if (!isSupabaseConfigured(config)) {
    return authDisabled();
  }

  const auth = inject(AuthStore);
  await sessionRestored(auth.loading, injector);

  return (
    auth.isAuthenticated() ||
    router.createUrlTree([nav.loginPath], { queryParams: { returnUrl: state.url } })
  );
};

/** Keeps signed-in users off the login and signup screens. */
export const guestGuard: CanActivateFn = async () => {
  const injector = inject(Injector);
  const router = inject(Router);
  const nav = inject(AUTH_NAVIGATION);
  const config = inject(SUPABASE_CONFIG, { optional: true });

  if (!isSupabaseConfigured(config)) {
    return true;
  }

  const auth = inject(AuthStore);
  await sessionRestored(auth.loading, injector);

  return auth.isAuthenticated() ? router.createUrlTree([nav.afterLoginPath]) : true;
};

/**
 * Requires a signed-in user holding every listed permission.
 *
 * Claims ride in the JWT, so they are as fresh as the token — see §7b. This guard
 * reads what is already there rather than forcing a refresh on every navigation.
 */
export function permissionGuard(...required: AppPermission[]): CanActivateFn {
  return async (route, state) => {
    const injector = inject(Injector);
    const router = inject(Router);
    const nav = inject(AUTH_NAVIGATION);
    const config = inject(SUPABASE_CONFIG, { optional: true });

    if (!isSupabaseConfigured(config)) {
      return authDisabled();
    }

    const auth = inject(AuthStore);
    await sessionRestored(auth.loading, injector);

    if (!auth.isAuthenticated()) {
      return router.createUrlTree([nav.loginPath], { queryParams: { returnUrl: state.url } });
    }

    return (
      required.every((permission) => auth.has(permission)) ||
      router.createUrlTree([nav.forbiddenPath])
    );
  };
}

/**
 * Sends the user to a setup page when Supabase credentials are missing, instead of
 * letting a page construct a client and throw.
 */
export function supabaseConfiguredGuard(setupPath = '/auth/setup'): CanActivateFn {
  return () => {
    const config = inject(SUPABASE_CONFIG, { optional: true });
    const router = inject(Router);
    return isSupabaseConfigured(config) ? true : router.createUrlTree([setupPath]);
  };
}
