import { InjectionToken, type Provider } from '@angular/core';

/**
 * A lazy handle on one locale's messages. Returning the raw `import()` promise
 * is what makes each locale its own chunk.
 */
export type TranslationLoaders = Record<string, () => Promise<unknown>>;

export interface TranslationSource {
  /**
   * Transloco scope these messages belong to. Omit for the root namespace —
   * the shared chrome (`common`, `auth`, `errors`) lives there.
   */
  readonly scope?: string;
  readonly loaders: TranslationLoaders;
}

/**
 * Multi-provided, so a lib and the app that consumes it can each contribute
 * messages to the same scope. Later registrations win key by key, which is how
 * an app overrides one string from a lib without restating the file.
 */
export const I18N_TRANSLATIONS = new InjectionToken<TranslationSource[]>(
  'I18N_TRANSLATIONS',
);

/** Register messages. Safe to call from a lib's own provider function. */
export function provideTranslations(
  ...sources: readonly TranslationSource[]
): Provider[] {
  return sources.map((source) => ({
    provide: I18N_TRANSLATIONS,
    useValue: source,
    multi: true,
  }));
}
