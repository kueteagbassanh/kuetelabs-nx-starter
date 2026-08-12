import { InjectionToken } from '@angular/core';
import type { Provider } from '@supabase/supabase-js';

export interface AuthPagesConfig {
  /** Shown in headings and the browser-visible copy. */
  appName: string;
  /** Where to go after a successful sign-in. */
  redirectAfterLogin: string;
  /** Self-service signup. Admin consoles usually set this false and invite instead. */
  signupEnabled: boolean;
  /** OAuth buttons to render, in order. Empty means password-only. */
  oauthProviders: Provider[];
  /** Minimum password length, mirrored from the Supabase project setting. */
  passwordMinLength: number;
  /** Optional footer links. */
  termsUrl?: string;
  privacyUrl?: string;
}

export const AUTH_PAGES_CONFIG = new InjectionToken<AuthPagesConfig>('AUTH_PAGES_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    appName: 'the app',
    redirectAfterLogin: '/',
    signupEnabled: true,
    oauthProviders: [],
    passwordMinLength: 8,
  }),
});

/** Convenience provider so an app can override only what differs. */
export function provideAuthPages(config: Partial<AuthPagesConfig>) {
  return {
    provide: AUTH_PAGES_CONFIG,
    useValue: {
      appName: 'the app',
      redirectAfterLogin: '/',
      signupEnabled: true,
      oauthProviders: [],
      passwordMinLength: 8,
      ...config,
    } satisfies AuthPagesConfig,
  };
}
