import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { injectCopyResolver } from './copy-resolver';
import { BUILT_IN_LOCALES, matchLocale } from './locale.model';
import { LocaleStore } from './locale.store';
import { CHROME_TRANSLATIONS } from './translations';
import { LazyTranslationLoader } from './translation.loader';
import { I18N_TRANSLATIONS } from './translation-source';
import { loadI18n, provideI18nTesting } from './testing';

describe('matchLocale', () => {
  it('matches an exact tag', () => {
    expect(matchLocale('fr', BUILT_IN_LOCALES)?.code).toBe('fr');
  });

  it('falls back to the primary subtag, so fr-CA resolves to fr', () => {
    expect(matchLocale('fr-CA', BUILT_IN_LOCALES)?.code).toBe('fr');
  });

  it('is case insensitive', () => {
    expect(matchLocale('FR', BUILT_IN_LOCALES)?.code).toBe('fr');
  });

  it('returns undefined for an unsupported or empty tag', () => {
    expect(matchLocale('de', BUILT_IN_LOCALES)).toBeUndefined();
    expect(matchLocale(null, BUILT_IN_LOCALES)).toBeUndefined();
  });
});

describe('LazyTranslationLoader', () => {
  it('deep-merges sources sharing a scope, with later registrations winning', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: I18N_TRANSLATIONS,
          multi: true,
          useValue: {
            loaders: {
              en: () =>
                Promise.resolve({ common: { save: 'Save', close: 'Close' } }),
            },
          },
        },
        {
          provide: I18N_TRANSLATIONS,
          multi: true,
          useValue: {
            loaders: { en: () => Promise.resolve({ common: { save: 'Store' } }) },
          },
        },
      ],
    });

    const translation = await TestBed.inject(
      LazyTranslationLoader,
    ).getTranslation('en');

    // The override replaced one leaf without dropping its sibling.
    expect(translation).toEqual({ common: { save: 'Store', close: 'Close' } });
  });

  it('unwraps the default export a JSON module arrives as', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: I18N_TRANSLATIONS,
          multi: true,
          useValue: {
            loaders: { en: () => Promise.resolve({ default: { a: 'b' } }) },
          },
        },
      ],
    });

    expect(
      await TestBed.inject(LazyTranslationLoader).getTranslation('en'),
    ).toEqual({ a: 'b' });
  });

  it('reads the scope out of a "scope/lang" path', async () => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: I18N_TRANSLATIONS,
          multi: true,
          useValue: {
            scope: 'billing',
            loaders: { en: () => Promise.resolve({ plan: 'Plan' }) },
          },
        },
        {
          provide: I18N_TRANSLATIONS,
          multi: true,
          useValue: {
            loaders: { en: () => Promise.resolve({ root: 'Root' }) },
          },
        },
      ],
    });

    const loader = TestBed.inject(LazyTranslationLoader);
    expect(await loader.getTranslation('billing/en')).toEqual({ plan: 'Plan' });
    expect(await loader.getTranslation('en')).toEqual({ root: 'Root' });
  });

  it('returns an empty object rather than throwing for an unknown language', async () => {
    TestBed.configureTestingModule({ providers: [] });
    expect(
      await TestBed.inject(LazyTranslationLoader).getTranslation('de'),
    ).toEqual({});
  });
});

describe('shipped chrome translations', () => {
  it('resolves the same key in both locales', async () => {
    TestBed.configureTestingModule({
      providers: [provideI18nTesting({ translations: CHROME_TRANSLATIONS })],
    });

    const transloco = TestBed.inject(TranslocoService);
    await loadI18n(transloco);
    expect(transloco.translate('errors.404.title')).toBe('Page not found');

    transloco.setActiveLang('fr');
    await loadI18n(transloco);
    expect(transloco.translate('errors.404.title')).toBe('Page introuvable');
  });

  it('has no key present in English but missing from French', async () => {
    const flatten = (value: unknown, prefix = ''): string[] =>
      typeof value === 'object' && value !== null
        ? Object.entries(value as Record<string, unknown>).flatMap(([k, v]) =>
            flatten(v, prefix ? `${prefix}.${k}` : k),
          )
        : [prefix];

    const en = flatten((await import('./translations/en.json')).default);
    const fr = new Set(flatten((await import('./translations/fr.json')).default));

    expect(en.filter((key) => !fr.has(key))).toEqual([]);
  });
});

describe('injectCopyResolver', () => {
  it('falls back to the literal when i18n was never provided', () => {
    TestBed.configureTestingModule({ providers: [] });
    const resolve = TestBed.runInInjectionContext(() => injectCopyResolver());
    expect(resolve()('errors.404.title', 'Page not found')).toBe(
      'Page not found',
    );
  });

  it('re-resolves after a language change finishes loading', async () => {
    // Regression: `langChanges$` fires before the new messages exist. Recomputing
    // on it alone read the old translations and never ran again, so data-driven
    // copy stayed in the previous language for good.
    TestBed.configureTestingModule({
      providers: [provideI18nTesting({ translations: CHROME_TRANSLATIONS })],
    });

    const transloco = TestBed.inject(TranslocoService);
    const resolve = TestBed.runInInjectionContext(() => injectCopyResolver());
    await loadI18n(transloco);
    expect(resolve()('errors.404.title', 'fallback')).toBe('Page not found');

    transloco.setActiveLang('fr');
    await loadI18n(transloco);

    expect(resolve()('errors.404.title', 'fallback')).toBe('Page introuvable');
  });

  it('interpolates params, and uses the fallback verbatim when the key is missing', async () => {
    TestBed.configureTestingModule({
      providers: [provideI18nTesting({ translations: CHROME_TRANSLATIONS })],
    });
    const transloco = TestBed.inject(TranslocoService);
    const resolve = TestBed.runInInjectionContext(() => injectCopyResolver());
    await loadI18n(transloco);

    expect(resolve()('errors.status', 'Error 404', { code: '404' })).toBe(
      'Error 404',
    );
    expect(resolve()('errors.nope.title', 'Untranslated')).toBe('Untranslated');
  });
});

describe('LocaleStore', () => {
  // `setLocale` persists to `document.cookie`, and jsdom keeps one document for
  // the whole file — without this, each test inherits the previous one's choice.
  beforeEach(() => {
    document.cookie = 'locale=;path=/;max-age=0';
  });

  it('defaults to the configured locale when no cookie is set', () => {
    TestBed.configureTestingModule({
      providers: [
        provideI18nTesting({
          translations: CHROME_TRANSLATIONS,
          defaultLocale: 'fr',
          autoDetect: false,
        }),
      ],
    });

    expect(TestBed.inject(LocaleStore).code()).toBe('fr');
  });

  it('switches language and mirrors it onto <html>', () => {
    TestBed.configureTestingModule({
      providers: [
        provideI18nTesting({
          translations: CHROME_TRANSLATIONS,
          autoDetect: false,
        }),
      ],
    });

    const store = TestBed.inject(LocaleStore);
    expect(store.code()).toBe('en');

    store.setLocale('fr');
    TestBed.tick();

    expect(store.code()).toBe('fr');
    expect(TestBed.inject(TranslocoService).getActiveLang()).toBe('fr');
    expect(document.documentElement.getAttribute('lang')).toBe('fr');
    expect(document.documentElement.getAttribute('dir')).toBe('ltr');
  });

  it('loads the new language, so catalog copy resolves without a directive', async () => {
    // Regression: `setActiveLang` marks a language active but does not fetch it.
    // The `*transloco` directive pulls messages in by itself; a catalog-driven
    // page reading through `injectCopyResolver` has nothing that would, so it
    // stayed in the old language after a switch.
    TestBed.configureTestingModule({
      providers: [
        provideI18nTesting({
          translations: CHROME_TRANSLATIONS,
          autoDetect: false,
        }),
      ],
    });

    const transloco = TestBed.inject(TranslocoService);
    const resolve = TestBed.runInInjectionContext(() => injectCopyResolver());
    await loadI18n(transloco);

    // Only setLocale — no explicit load, no directive.
    TestBed.inject(LocaleStore).setLocale('fr');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(resolve()('errors.404.title', 'fallback')).toBe('Page introuvable');
  });

  it('does not auto-detect before the first render', () => {
    // The detection lives in `afterNextRender`, so that a server-rendered page
    // and the hydrating client agree on the language for the first paint.
    // Instantiating the store must not, on its own, move off the default.
    TestBed.configureTestingModule({
      providers: [
        provideI18nTesting({
          translations: CHROME_TRANSLATIONS,
          autoDetect: true,
        }),
      ],
    });

    expect(TestBed.inject(LocaleStore).code()).toBe('en');
  });

  it('ignores an unsupported locale instead of throwing', () => {
    TestBed.configureTestingModule({
      providers: [
        provideI18nTesting({
          translations: CHROME_TRANSLATIONS,
          autoDetect: false,
        }),
      ],
    });

    const store = TestBed.inject(LocaleStore);
    store.setLocale('de');
    expect(store.code()).toBe('en');
  });
});
