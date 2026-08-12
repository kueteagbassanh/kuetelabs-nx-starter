import { InjectionToken } from '@angular/core';
import type { ErrorCode, ErrorDefinition } from './error.model';

export interface ErrorPagesConfig {
  /** Prefixed to the document title, e.g. "Page not found · Admin". */
  appName: string;
  /** Target of every "home" action. */
  homePath: string;
  /**
   * Target of every "login" action. Mirror `AUTH_NAVIGATION.loginPath` here — this
   * lib deliberately does not import the guards so it stays usable in an app with
   * no Supabase wiring at all.
   */
  loginPath: string;
  /** External status page or help desk. "support" actions are dropped without it. */
  supportUrl?: string;
  /** The oversized 404/500 glyph. Turn off for a wordmark-only look. */
  showStatusCode: boolean;
  /** Set `<title>` from the error definition. Off for apps that own titles centrally. */
  setDocumentTitle: boolean;
  /** Per-code copy overrides, merged over `ERROR_CATALOG` field by field. */
  catalog: Partial<Record<ErrorCode, Partial<ErrorDefinition>>>;
}

const DEFAULT_ERROR_PAGES_CONFIG: ErrorPagesConfig = {
  appName: 'the app',
  homePath: '/',
  loginPath: '/auth/login',
  showStatusCode: true,
  setDocumentTitle: true,
  catalog: {},
};

export const ERROR_PAGES_CONFIG = new InjectionToken<ErrorPagesConfig>('ERROR_PAGES_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_ERROR_PAGES_CONFIG,
});

/** Convenience provider so an app can override only what differs. */
export function provideErrorPages(config: Partial<ErrorPagesConfig>) {
  return {
    provide: ERROR_PAGES_CONFIG,
    useValue: { ...DEFAULT_ERROR_PAGES_CONFIG, ...config } satisfies ErrorPagesConfig,
  };
}
