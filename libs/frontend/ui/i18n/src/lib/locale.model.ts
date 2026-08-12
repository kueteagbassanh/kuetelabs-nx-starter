/** Writing direction of a locale. Drives the `dir` attribute on `<html>`. */
export type TextDirection = 'ltr' | 'rtl';

export interface LocaleDefinition {
  /** BCP-47 tag. Used by Transloco, `<html lang>`, and every `Intl.*` formatter. */
  readonly code: string;
  /**
   * The language's name *in that language* (its endonym). Deliberately not a
   * translation key: a picker that renders every option in the current language
   * is unusable to someone who cannot read the current language.
   */
  readonly label: string;
  readonly dir: TextDirection;
}

export const LOCALE_EN: LocaleDefinition = {
  code: 'en',
  label: 'English',
  dir: 'ltr',
};

export const LOCALE_FR: LocaleDefinition = {
  code: 'fr',
  label: 'Français',
  dir: 'ltr',
};

/** What the starter ships with. Apps pass their own list to `provideI18n`. */
export const BUILT_IN_LOCALES: readonly LocaleDefinition[] = [
  LOCALE_EN,
  LOCALE_FR,
];

/**
 * Best-effort match of a browser/`Accept-Language` tag onto a supported locale:
 * exact tag first, then the primary subtag, so `fr-CA` resolves to `fr`.
 */
export function matchLocale(
  tag: string | null | undefined,
  locales: readonly LocaleDefinition[],
): LocaleDefinition | undefined {
  if (!tag) {
    return undefined;
  }
  const normalized = tag.toLowerCase();
  const exact = locales.find((l) => l.code.toLowerCase() === normalized);
  if (exact) {
    return exact;
  }
  const primary = normalized.split('-')[0];
  return locales.find((l) => l.code.toLowerCase().split('-')[0] === primary);
}
