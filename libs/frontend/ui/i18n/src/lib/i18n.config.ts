import { InjectionToken } from '@angular/core';
import { BUILT_IN_LOCALES, type LocaleDefinition } from './locale.model';

export interface I18nConfig {
  /** Every locale the app offers, in the order the switcher lists them. */
  locales: readonly LocaleDefinition[];
  /** Used when the visitor has no stored preference. Must be one of `locales`. */
  defaultLocale: string;
  /**
   * Cookie holding the choice. A cookie rather than `localStorage` on purpose:
   * SSR has to resolve the same locale the browser will, and only a cookie
   * travels with the request. See this lib's README.
   */
  cookieName: string;
  /** Cookie lifetime in seconds. Defaults to one year. */
  cookieMaxAge: number;
  /**
   * After hydration, adopt `navigator.language` when the visitor has no cookie
   * yet. Deliberately post-hydration — see `resolveInitialLocale`.
   */
  autoDetect: boolean;
}

export const DEFAULT_I18N_CONFIG: I18nConfig = {
  locales: BUILT_IN_LOCALES,
  defaultLocale: 'en',
  cookieName: 'locale',
  cookieMaxAge: 60 * 60 * 24 * 365,
  autoDetect: true,
};

export const I18N_CONFIG = new InjectionToken<I18nConfig>('I18N_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_I18N_CONFIG,
});

/**
 * Present only when `provideI18n()` ran. Deliberately without a root factory, so
 * `inject(I18N_ENABLED, { optional: true })` is a truthful probe.
 *
 * Needed because `TranslocoService` cannot answer the question itself: it is
 * `providedIn: 'root'`, but several of its dependencies (the transpiler, the
 * missing handler) have no root factory, so injecting it in an app that never
 * called `provideI18n()` throws instead of returning null — `{ optional: true }`
 * does not help, since the token resolves and its *construction* is what fails.
 * Libs that must render with nothing configured (`error-layout`) probe this first.
 */
export const I18N_ENABLED = new InjectionToken<boolean>('I18N_ENABLED');
