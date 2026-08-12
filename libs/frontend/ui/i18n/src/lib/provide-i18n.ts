import {
  inject,
  isDevMode,
  provideAppInitializer,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import { TranslocoService, provideTransloco } from '@jsverse/transloco';
import { firstValueFrom } from 'rxjs';
import {
  DEFAULT_I18N_CONFIG,
  I18N_CONFIG,
  I18N_ENABLED,
  type I18nConfig,
} from './i18n.config';
import { resolveInitialLocale } from './locale-resolution';
import { LocaleStore } from './locale.store';
import { LazyTranslationLoader } from './translation.loader';
import { CHROME_TRANSLATIONS } from './translations';
import { provideTranslations, type TranslationSource } from './translation-source';

export interface I18nOptions extends Partial<I18nConfig> {
  /** Extra message files — app copy, or a lazily-scoped feature's. */
  translations?: readonly TranslationSource[];
}

/**
 * Wire up runtime i18n. Returns an array, so spread it:
 * `...provideI18n({ defaultLocale: 'fr' })`.
 *
 * Runtime translation (Transloco) rather than Angular's build-time `$localize`,
 * because this workspace ships one SSR server and one SPA: `$localize` would
 * mean a separate build and a separate deployed bundle per language, and the
 * language could not be changed without a full page load.
 */
export function provideI18n(
  options: I18nOptions = {},
): (Provider | EnvironmentProviders)[] {
  const { translations = [], ...overrides } = options;
  const config: I18nConfig = { ...DEFAULT_I18N_CONFIG, ...overrides };

  return [
    { provide: I18N_CONFIG, useValue: config },
    // Lets libs that must survive an unconfigured app probe for i18n safely.
    { provide: I18N_ENABLED, useValue: true },

    // The shared chrome first, so app-supplied files can override single keys.
    ...provideTranslations(...CHROME_TRANSLATIONS, ...translations),

    ...provideTransloco({
      loader: LazyTranslationLoader,
      config: {
        availableLangs: config.locales.map((l) => l.code),
        defaultLang: config.defaultLocale,
        fallbackLang: config.defaultLocale,
        // Required for switching without a reload: re-renders bound keys on change.
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
        missingHandler: {
          logMissingKey: isDevMode(),
          // An untranslated key falls back to the default locale's copy rather
          // than rendering the raw key at the user.
          useFallbackTranslation: true,
          allowEmpty: false,
        },
      },
    }),

    // Resolve the language and have its messages in memory *before* the first
    // render, on both platforms. Without this the server emits empty strings —
    // Transloco's load is a plain promise Angular's stability check cannot see.
    provideAppInitializer(() => {
      // Everything that injects has to happen before the first `await` — after
      // one, this is no longer an injection context and `inject()` throws NG0203.
      const transloco = inject(TranslocoService);
      const initial = resolveInitialLocale();
      transloco.setActiveLang(initial.code);

      // After `setActiveLang`, so the store observes the language it will render
      // with. Instantiating it here is what sets `<html lang>`/`dir` for this
      // render — the switcher may not be mounted on every page.
      inject(LocaleStore);

      // Read back rather than reusing `initial`: the store is entitled to have
      // changed the active language on the way through.
      return firstValueFrom(transloco.load(transloco.getActiveLang()));
    }),
  ];
}
