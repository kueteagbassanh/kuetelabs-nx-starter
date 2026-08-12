import type { TranslationSource } from '../translation-source';

/**
 * Messages for the chrome every app in this workspace shares — the auth pages,
 * the error screens, and the handful of generic labels in `common`.
 *
 * Each entry is a bare `import()` so the bundler emits one chunk per locale and
 * only the active one is ever fetched. Adding a locale means adding a file here
 * *and* a `LocaleDefinition`; the switcher lists the definitions, this map is
 * what actually loads.
 */
export const CHROME_TRANSLATIONS: readonly TranslationSource[] = [
  {
    loaders: {
      en: () => import('./en.json'),
      fr: () => import('./fr.json'),
    },
  },
];
