/**
 * Every screen the error layout can render.
 *
 * Numeric members are HTTP statuses an app can actually land on client-side; the
 * string members are conditions the network never assigns a status to. `unknown`
 * is the fallback the wildcard child route renders, so an unrecognised code shows
 * a real page instead of a blank outlet.
 */
export type ErrorCode =
  | 400
  | 401
  | 403
  | 404
  | 408
  | 410
  | 429
  | 500
  | 502
  | 503
  | 504
  | 'offline'
  | 'maintenance'
  | 'unknown';

/**
 * What a button on an error page does. Kept as a closed union rather than a
 * callback so the catalog stays serialisable data — an app can override copy in
 * `ERROR_PAGES_CONFIG` without the lib handing out behaviour it cannot audit.
 */
export type ErrorActionKind =
  /** Router-navigate to `homePath`. */
  | 'home'
  /** `Location.back()`, hidden when there is no in-app history to go back to. */
  | 'back'
  /** Re-request the current URL. Browser-only. */
  | 'retry'
  /** Router-navigate to `loginPath`, carrying `returnUrl` when one is present. */
  | 'login'
  /** External link to `supportUrl`; skipped entirely when that is not configured. */
  | 'support';

export interface ErrorAction {
  kind: ErrorActionKind;
  label: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
}

export interface ErrorDefinition {
  /** The oversized glyph above the title. Empty string renders no glyph. */
  status: string;
  /** Also used as the document title, prefixed with the app name. */
  title: string;
  description: string;
  /** Lucide icon name. Every name used here is provided by `ErrorPage` itself. */
  icon: string;
  /** Drives the icon colour only — `destructive` for faults, `muted` otherwise. */
  tone: 'muted' | 'destructive';
  /** Rendered in order; the first one gets keyboard focus. */
  actions: ErrorAction[];
  /** Small print under the actions, for the "what do I do now" detail. */
  hint?: string;
}
