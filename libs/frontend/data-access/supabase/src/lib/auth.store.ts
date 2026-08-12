import { DestroyRef, computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';
import type { AuthChangeEvent, Provider, Session, User } from '@supabase/supabase-js';
import { type AppPermission, type AppRole, jwtClaimsSchema } from '@kuetelabs/shared/domain';
import { injectSupabaseClient } from './supabase-client';

interface AuthState {
  session: Session | null;
  loading: boolean;
}

const initialState: AuthState = { session: null, loading: true };

/** Decodes a JWT payload without verifying it — the server verifies; this is for UI only. */
function decodeClaims(accessToken: string | undefined): {
  roles: AppRole[];
  permissions: AppPermission[];
} {
  if (!accessToken) {
    return { roles: [], permissions: [] };
  }
  try {
    const payload = accessToken.split('.')[1];
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    const parsed = jwtClaimsSchema.parse({
      app_roles: json.app_roles ?? [],
      app_permissions: json.app_permissions ?? [],
    });
    return { roles: parsed.app_roles, permissions: parsed.app_permissions };
  } catch {
    // An unparseable token grants nothing. Failing closed matters here.
    return { roles: [], permissions: [] };
  }
}

/**
 * Session and RBAC claims.
 *
 * Claims come from the JWT (stamped by custom_access_token_hook), so they are only
 * as fresh as the token: a role change lands on the next refresh. Treat them as UI
 * affordances — the database re-checks every read through RLS and the API re-checks
 * every write. Never rely on them as the security boundary.
 */
export const AuthStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ session }) => {
    const claims = computed(() => decodeClaims(session()?.access_token));
    return {
      user: computed<User | null>(() => session()?.user ?? null),
      isAuthenticated: computed(() => session() !== null),
      roles: computed(() => claims().roles),
      permissions: computed(() => claims().permissions),
    };
  }),
  withMethods((store, supabase = injectSupabaseClient()) => ({
    has(permission: AppPermission): boolean {
      return store.permissions().includes(permission);
    },

    hasAny(...permissions: AppPermission[]): boolean {
      return permissions.some((permission) => store.permissions().includes(permission));
    },

    hasRole(role: AppRole): boolean {
      return store.roles().includes(role);
    },

    signInWithPassword(email: string, password: string) {
      return supabase.auth.signInWithPassword({ email, password });
    },

    signUp(email: string, password: string, fullName?: string) {
      return supabase.auth.signUp({
        email,
        password,
        options: { data: fullName ? { full_name: fullName } : undefined },
      });
    },

    signOut() {
      return supabase.auth.signOut();
    },

    /** Starts an OAuth redirect. The provider returns to `redirectTo`. */
    signInWithOAuth(provider: Provider, redirectTo: string) {
      return supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
    },

    /** Emails a password-reset link pointing at the app's callback route. */
    resetPasswordForEmail(email: string, redirectTo: string) {
      return supabase.auth.resetPasswordForEmail(email, { redirectTo });
    },

    /** Sets a new password for the session created by a reset link. */
    updatePassword(password: string) {
      return supabase.auth.updateUser({ password });
    },

    /**
     * Completes a PKCE redirect (OAuth, magic link, email confirmation) by trading
     * the `code` query parameter for a session.
     */
    exchangeCodeForSession(code: string) {
      return supabase.auth.exchangeCodeForSession(code);
    },

    /** Pulls a new token so role changes apply without signing out. */
    async refreshClaims(): Promise<void> {
      const { data } = await supabase.auth.refreshSession();
      patchState(store, { session: data.session });
    },

    /** Internal: keeps the store in step with Supabase's auth events. */
    setSession(session: Session | null): void {
      patchState(store, { session, loading: false });
    },
  })),
  withHooks({
    onInit(store, supabase = injectSupabaseClient(), destroyRef = inject(DestroyRef)) {
      void supabase.auth.getSession().then(({ data }) => store.setSession(data.session));

      const { data } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session) =>
        store.setSession(session),
      );
      // onInit runs in an injection context, so cleanup registers here rather than
      // being threaded to onDestroy through module scope.
      destroyRef.onDestroy(() => data.subscription.unsubscribe());
    },
  }),
);
