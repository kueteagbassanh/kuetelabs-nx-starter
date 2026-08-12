import { DOCUMENT, PLATFORM_ID, REQUEST, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { I18N_CONFIG } from './i18n.config';
import { matchLocale, type LocaleDefinition } from './locale.model';

/** Pull one cookie out of a `Cookie:`/`document.cookie` header string. */
function readCookie(jar: string | null | undefined, name: string): string | null {
  if (!jar) {
    return null;
  }
  for (const part of jar.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) {
      continue;
    }
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

/**
 * The stored preference, or null. Works on both platforms: during SSR the jar
 * comes off the incoming request, in the browser off `document.cookie`.
 */
export function readLocaleCookie(): string | null {
  const { cookieName } = inject(I18N_CONFIG);

  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    return readCookie(inject(DOCUMENT).cookie, cookieName);
  }

  // Server. `document.cookie` is deliberately *not* a fallback here: Angular's
  // server DOM shim throws `NotYetImplemented` for it, which fails the build
  // during prerendering. Null is the right answer anyway — a prerendered page
  // is shared by every visitor, so it must not bake in one visitor's language.
  const request = inject(REQUEST, { optional: true });
  return request ? readCookie(request.headers.get('cookie'), cookieName) : null;
}

/**
 * The locale to render with *before* anything paints.
 *
 * Only the cookie is consulted, on both platforms, and that is the whole point:
 * SSR and the hydrating client must reach the identical answer or the first
 * render mismatches and Angular throws the DOM away. `navigator.language` is
 * therefore *not* read here — it cannot be seen from the server. Adopting it is
 * a post-hydration concern, handled by `LocaleStore`'s auto-detect hook, which
 * runs as an ordinary language change after the DOM is already stable.
 */
export function resolveInitialLocale(): LocaleDefinition {
  const config = inject(I18N_CONFIG);
  const stored = matchLocale(readLocaleCookie(), config.locales);
  return (
    stored ??
    matchLocale(config.defaultLocale, config.locales) ??
    config.locales[0]
  );
}
