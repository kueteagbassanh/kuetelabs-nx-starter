import type { ErrorCode, ErrorDefinition } from './error.model';

/**
 * Copy for every error screen, as data.
 *
 * Keeping this a plain record (rather than one component per status) is the whole
 * point of the refactor: adding a status is one entry plus one route, and every
 * screen stays visually identical for free. Apps that need different wording
 * override entries through `provideErrorPages({ catalog: { 404: { ... } } })`.
 */
export const ERROR_CATALOG: Record<ErrorCode, ErrorDefinition> = {
  400: {
    status: '400',
    title: 'That request did not make sense',
    description:
      'The server could not read the request. This usually means a link was edited by hand or a form was submitted twice.',
    icon: 'lucideCircleAlert',
    tone: 'muted',
    actions: [
      { kind: 'back', label: 'Go back' },
      { kind: 'home', label: 'Home', variant: 'outline' },
    ],
  },
  401: {
    status: '401',
    title: 'You need to sign in',
    description:
      'This page is only available to signed-in accounts. Your session may simply have expired while the tab was open.',
    icon: 'lucideLockKeyhole',
    tone: 'muted',
    actions: [
      { kind: 'login', label: 'Sign in' },
      { kind: 'home', label: 'Home', variant: 'outline' },
    ],
  },
  403: {
    status: '403',
    title: 'Not permitted',
    description:
      "Your account doesn't hold the permission this page requires. If you think that is wrong, ask an administrator to check your roles.",
    icon: 'lucideShieldBan',
    tone: 'muted',
    // Preserves the note from the old admin-only Forbidden page: permissions ride
    // in the access token, so a fresh grant is invisible until the token renews.
    hint: 'If a role was just granted, sign out and back in — permissions travel in the access token.',
    actions: [
      { kind: 'home', label: 'Back to home' },
      { kind: 'login', label: 'Use another account', variant: 'outline' },
    ],
  },
  404: {
    status: '404',
    title: 'Page not found',
    description:
      'The page you asked for does not exist. It may have been renamed or removed, or the link that brought you here may be out of date.',
    icon: 'lucideCompass',
    tone: 'muted',
    actions: [
      { kind: 'home', label: 'Back to home' },
      { kind: 'back', label: 'Go back', variant: 'outline' },
    ],
  },
  408: {
    status: '408',
    title: 'The request timed out',
    description:
      'The server took too long to answer. A slow or intermittent connection is the usual cause.',
    icon: 'lucideHourglass',
    tone: 'muted',
    actions: [
      { kind: 'retry', label: 'Try again' },
      { kind: 'home', label: 'Home', variant: 'outline' },
    ],
  },
  410: {
    status: '410',
    title: 'This page is gone',
    description:
      'The resource used to live here and has been permanently removed. There is no new address to forward you to.',
    icon: 'lucideArchiveX',
    tone: 'muted',
    actions: [
      { kind: 'home', label: 'Back to home' },
      { kind: 'back', label: 'Go back', variant: 'outline' },
    ],
  },
  429: {
    status: '429',
    title: 'Too many requests',
    description:
      'You have hit a rate limit. Wait a moment before trying again — repeated retries will keep the limit in place for longer.',
    icon: 'lucideGauge',
    tone: 'muted',
    actions: [
      { kind: 'retry', label: 'Try again' },
      { kind: 'home', label: 'Home', variant: 'outline' },
    ],
  },
  500: {
    status: '500',
    title: 'Something went wrong on our side',
    description:
      'An unexpected error stopped this page from loading. Nothing you did caused it, and it has been logged.',
    icon: 'lucideTriangleAlert',
    tone: 'destructive',
    actions: [
      { kind: 'retry', label: 'Reload' },
      { kind: 'home', label: 'Home', variant: 'outline' },
      { kind: 'support', label: 'Contact support', variant: 'ghost' },
    ],
  },
  502: {
    status: '502',
    title: 'Bad gateway',
    description:
      'A service this page depends on returned an invalid response. It is usually a deployment in progress and clears on its own.',
    icon: 'lucideServerCrash',
    tone: 'destructive',
    actions: [
      { kind: 'retry', label: 'Try again' },
      { kind: 'home', label: 'Home', variant: 'outline' },
    ],
  },
  503: {
    status: '503',
    title: 'Temporarily unavailable',
    description:
      'The service is down for a short while. It should be back without you having to do anything.',
    icon: 'lucideConstruction',
    tone: 'muted',
    actions: [
      { kind: 'retry', label: 'Try again' },
      { kind: 'support', label: 'Check status', variant: 'outline' },
    ],
  },
  504: {
    status: '504',
    title: 'Gateway timed out',
    description:
      'An upstream service did not answer in time. This tends to resolve within a minute or two.',
    icon: 'lucideServerOff',
    tone: 'destructive',
    actions: [
      { kind: 'retry', label: 'Try again' },
      { kind: 'home', label: 'Home', variant: 'outline' },
    ],
  },
  offline: {
    // No status glyph: the browser never got far enough to receive one.
    status: '',
    title: "You're offline",
    description:
      'This device has no network connection, so the page could not be loaded. The page will tell you as soon as the connection is back.',
    icon: 'lucideWifiOff',
    tone: 'muted',
    actions: [{ kind: 'retry', label: 'Try again' }],
  },
  maintenance: {
    status: '',
    title: 'Down for maintenance',
    description:
      'We are making a planned change and will be back shortly. Nothing is lost — your data is untouched.',
    icon: 'lucideWrench',
    tone: 'muted',
    actions: [
      { kind: 'retry', label: 'Try again' },
      { kind: 'support', label: 'Check status', variant: 'outline' },
    ],
  },
  unknown: {
    status: '',
    title: 'Something went wrong',
    description:
      'We could not work out what failed. Reloading fixes most of these; if it does not, the link may be broken.',
    icon: 'lucideCircleHelp',
    tone: 'muted',
    actions: [
      { kind: 'retry', label: 'Reload' },
      { kind: 'home', label: 'Home', variant: 'outline' },
    ],
  },
};

/** Codes with a dedicated child route under the error container, in menu order. */
export const ERROR_CODES = Object.keys(ERROR_CATALOG) as ErrorCode[];

/**
 * Narrows anything a route or an interceptor hands over into a known code.
 *
 * Route params arrive as strings, so `/error/500` gives `'500'`, not `500`. Codes
 * with no catalog entry fall back to `unknown` rather than rendering an empty page.
 */
export function resolveErrorCode(raw: unknown): ErrorCode {
  if (typeof raw === 'number' || typeof raw === 'string') {
    const key = String(raw);
    if (Object.prototype.hasOwnProperty.call(ERROR_CATALOG, key)) {
      return (Number.isNaN(Number(key)) ? key : Number(key)) as ErrorCode;
    }
  }
  return 'unknown';
}
