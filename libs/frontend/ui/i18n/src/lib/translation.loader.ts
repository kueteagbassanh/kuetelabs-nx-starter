import { Injectable, inject } from '@angular/core';
import type { TranslocoLoader, Translation } from '@jsverse/transloco';
import { I18N_TRANSLATIONS, type TranslationSource } from './translation-source';

type Dict = Record<string, unknown>;

function isPlainObject(value: unknown): value is Dict {
  return (
    typeof value === 'object' && value !== null && !Array.isArray(value)
  );
}

/** Recursive merge; `override` wins at the leaves. Neither input is mutated. */
function deepMerge(base: Dict, override: Dict): Dict {
  const out: Dict = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const existing = out[key];
    out[key] =
      isPlainObject(existing) && isPlainObject(value)
        ? deepMerge(existing, value)
        : value;
  }
  return out;
}

/**
 * A JSON module arrives as `{ default: {...} }` under ESM interop but as the
 * bare object under some bundler settings. Accept either.
 */
function unwrap(module: unknown): Dict {
  if (isPlainObject(module) && isPlainObject(module['default'])) {
    return module['default'];
  }
  return isPlainObject(module) ? module : {};
}

/**
 * Resolves messages from statically-declared `import()` calls instead of HTTP.
 *
 * Transloco's stock loader fetches `/assets/i18n/{lang}.json`, which costs us
 * three things this repo would rather not pay: the translation files have to be
 * copied out of the lib into every app's `assets` glob, SSR needs an absolute
 * URL to fetch its own origin, and the payload then has to be replayed to the
 * client through `TransferState` to avoid fetching it twice. A dynamic import
 * has none of those problems and still produces one lazy chunk per locale.
 */
@Injectable({ providedIn: 'root' })
export class LazyTranslationLoader implements TranslocoLoader {
  private readonly sources = inject<TranslationSource[]>(I18N_TRANSLATIONS, {
    optional: true,
  });

  async getTranslation(path: string): Promise<Translation> {
    // Transloco asks for "en" for the root namespace and "scope/en" for a scope.
    const slash = path.lastIndexOf('/');
    const scope = slash === -1 ? undefined : path.slice(0, slash);
    const lang = slash === -1 ? path : path.slice(slash + 1);

    const matching = (this.sources ?? []).filter((s) => s.scope === scope);

    const loaded = await Promise.all(
      matching
        .map((source) => source.loaders[lang])
        .filter((loader): loader is () => Promise<unknown> => Boolean(loader))
        .map((loader) => loader().then(unwrap)),
    );

    return loaded.reduce<Dict>((acc, next) => deepMerge(acc, next), {});
  }
}
