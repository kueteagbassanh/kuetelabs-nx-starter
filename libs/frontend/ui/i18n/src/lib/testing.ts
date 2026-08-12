import {
  isDevMode,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import { TranslocoService, provideTransloco } from '@jsverse/transloco';
import { DEFAULT_I18N_CONFIG, I18N_CONFIG, I18N_ENABLED } from './i18n.config';
import type { I18nConfig } from './i18n.config';
import { LazyTranslationLoader } from './translation.loader';
import { provideTranslations, type TranslationSource } from './translation-source';

export interface I18nTestingOptions extends Partial<I18nConfig> {
  /**
   * Messages to serve. Pass the real files to assert on copy, or a handful of
   * keys to keep a test readable.
   */
  translations?: readonly TranslationSource[];
}

/**
 * i18n for a TestBed, without the app initializer.
 *
 * `provideI18n()` preloads the active language through `provideAppInitializer`,
 * which a `TestBed` does not run — so a component under test would render before
 * any messages arrived. Tests instead call `loadI18n()` after configuring, or
 * assert against keys.
 */
export function provideI18nTesting(
  options: I18nTestingOptions = {},
): (Provider | EnvironmentProviders)[] {
  const { translations = [], ...overrides } = options;
  const config: I18nConfig = { ...DEFAULT_I18N_CONFIG, ...overrides };

  return [
    { provide: I18N_CONFIG, useValue: config },
    { provide: I18N_ENABLED, useValue: true },
    ...provideTranslations(...translations),
    ...provideTransloco({
      loader: LazyTranslationLoader,
      config: {
        availableLangs: config.locales.map((l) => l.code),
        defaultLang: config.defaultLocale,
        fallbackLang: config.defaultLocale,
        reRenderOnLangChange: true,
        // Quiet: a test that only exercises a few keys should not fill the
        // reporter with warnings about the ones it deliberately left out.
        prodMode: !isDevMode(),
        missingHandler: {
          logMissingKey: false,
          useFallbackTranslation: true,
          allowEmpty: false,
        },
      },
    }),
  ];
}

/**
 * Await the active language's messages inside a test. Call after
 * `TestBed.configureTestingModule(...)` and before the first `detectChanges()`.
 */
export async function loadI18n(service: TranslocoService): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    service.load(service.getActiveLang()).subscribe({
      next: () => resolve(),
      error: reject,
    });
  });
}
