import {
  DOCUMENT,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  isDevMode,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslocoService } from '@jsverse/transloco';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { I18N_CONFIG } from './i18n.config';
import { matchLocale, type LocaleDefinition } from './locale.model';
import { readLocaleCookie, resolveInitialLocale } from './locale-resolution';

interface LocaleState {
  current: LocaleDefinition;
}

/**
 * The app's language, and the only supported way to change it.
 *
 * Wraps `TranslocoService` rather than replacing it: Transloco stays the thing
 * that resolves messages, this store owns the *policy* around the choice —
 * where it is persisted, what `<html>` advertises, and which locales are legal.
 */
export const LocaleStore = signalStore(
  { providedIn: 'root' },
  withState<LocaleState>(() => ({ current: resolveInitialLocale() })),

  withComputed((store) => {
    const config = inject(I18N_CONFIG);
    return {
      available: computed(() => config.locales),
      code: computed(() => store.current().code),
      dir: computed(() => store.current().dir),
      isRtl: computed(() => store.current().dir === 'rtl'),
    };
  }),

  withMethods((store) => {
    const config = inject(I18N_CONFIG);
    const transloco = inject(TranslocoService);
    const document = inject(DOCUMENT);
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

    return {
      /**
       * Switch language. Unknown codes are ignored rather than thrown: this is
       * reachable from a URL or a stale cookie, neither of which is a bug.
       */
      setLocale(code: string): void {
        const locale = matchLocale(code, config.locales);
        if (!locale) {
          if (isDevMode()) {
            console.warn(
              `[i18n] Ignoring unsupported locale "${code}". Known: ${config.locales
                .map((l) => l.code)
                .join(', ')}.`,
            );
          }
          return;
        }
        if (locale.code === store.current().code) {
          return;
        }

        transloco.setActiveLang(locale.code);

        // `setActiveLang` only marks the language active — it does not fetch it.
        // The `*transloco` directive would pull the messages in on its own, but a
        // page whose copy comes from a catalog through `injectCopyResolver` has no
        // directive to do that, and would sit in the previous language forever.
        // Loading here covers both kinds of consumer.
        transloco.load(locale.code).subscribe({
          error: (cause: unknown) => {
            if (isDevMode()) {
              console.error(`[i18n] Failed to load "${locale.code}".`, cause);
            }
          },
        });

        patchState(store, { current: locale });

        if (isBrowser) {
          // `SameSite=Lax` so the SSR render of a normal navigation still sees it.
          document.cookie =
            `${config.cookieName}=${encodeURIComponent(locale.code)};` +
            `path=/;max-age=${config.cookieMaxAge};SameSite=Lax`;
        }
      },
    };
  }),

  withHooks({
    onInit(store) {
      const config = inject(I18N_CONFIG);
      const document = inject(DOCUMENT);
      // Read now, while this is still an injection context.
      const hasStoredLocale = readLocaleCookie() !== null;

      // Keep the document in step with the store. Runs on the server too, so the
      // server-rendered HTML already carries the right lang/dir.
      effect(() => {
        const locale = store.current();
        document.documentElement.setAttribute('lang', locale.code);
        document.documentElement.setAttribute('dir', locale.dir);
      });

      // First-visit detection, and the reason it is in `afterNextRender` rather
      // than here: `navigator.language` is an answer the server cannot produce,
      // so acting on it before the first render would make the client disagree
      // with the server's HTML and lose hydration. `afterNextRender` is
      // browser-only and runs once the DOM is settled, which turns this into an
      // ordinary language change. Skipped entirely once a cookie exists.
      if (config.autoDetect && !hasStoredLocale) {
        afterNextRender(() => {
          const detected = matchLocale(
            document.defaultView?.navigator.language,
            config.locales,
          );
          if (detected) {
            // Also writes the cookie, so this never runs for this visitor again.
            store.setLocale(detected.code);
          }
        });
      }
    },
  }),
);
