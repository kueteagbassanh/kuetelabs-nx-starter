export {
  DEFAULT_I18N_CONFIG,
  I18N_CONFIG,
  I18N_ENABLED,
  type I18nConfig,
} from './lib/i18n.config';
export {
  BUILT_IN_LOCALES,
  LOCALE_EN,
  LOCALE_FR,
  matchLocale,
  type LocaleDefinition,
  type TextDirection,
} from './lib/locale.model';
export { readLocaleCookie, resolveInitialLocale } from './lib/locale-resolution';
export { LocaleStore } from './lib/locale.store';
export { injectCopyResolver, type CopyResolver } from './lib/copy-resolver';
export { LanguageSwitcher } from './lib/language-switcher';
export { provideI18n, type I18nOptions } from './lib/provide-i18n';
export {
  I18N_TRANSLATIONS,
  provideTranslations,
  type TranslationLoaders,
  type TranslationSource,
} from './lib/translation-source';
export { LazyTranslationLoader } from './lib/translation.loader';
export { CHROME_TRANSLATIONS } from './lib/translations';
export {
  loadI18n,
  provideI18nTesting,
  type I18nTestingOptions,
} from './lib/testing';

// Re-exported so consumers translate templates without also importing Transloco
// directly — one import path for the whole feature, and one place to swap the
// engine if that ever happens.
export {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
  translateSignal,
} from '@jsverse/transloco';
