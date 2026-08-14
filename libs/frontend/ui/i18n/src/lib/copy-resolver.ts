import { computed, inject, type Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { merge } from 'rxjs';
import { filter, scan } from 'rxjs/operators';
import { I18N_ENABLED } from './i18n.config';

/**
 * Looks up `key`, falling back when there is no translation for it (or no i18n
 * configured at all).
 *
 * `fallback` defaults to the key itself. That is what lets a config object hold
 * *either* a translation key or a literal sentence: a key resolves, and a
 * sentence with no matching entry renders as written.
 *
 * `params` feeds `{{ }}` placeholders in the translation. It is *not* applied to
 * `fallback` — a caller supplying a fallback already knows the values and can
 * interpolate them itself, which keeps this from reimplementing the transpiler.
 */
export type CopyResolver = (
  key: string,
  fallback?: string,
  params?: Record<string, unknown>,
) => string;

/**
 * A `CopyResolver` that re-evaluates when the language changes.
 *
 * For data-driven copy — a catalog or a config object that holds *strings*, not
 * template bindings, so the `transloco` pipe cannot reach it. Template text
 * should use the pipe instead; this is the escape hatch for the cases the pipe
 * structurally cannot cover.
 *
 * Must be called from an injection context.
 */
export function injectCopyResolver(): Signal<CopyResolver> {
  const enabled = inject(I18N_ENABLED, { optional: true }) ?? false;

  if (!enabled) {
    // No i18n in this app: every lookup is its own fallback. Constant, so
    // consumers can depend on it unconditionally.
    return computed(() => (key: string, fallback?: string) => fallback ?? key);
  }

  const transloco = inject(TranslocoService);

  /**
   * Bumped on every language change *and* on every completed load.
   *
   * Both halves are needed. `langChanges$` fires the moment `setActiveLang` is
   * called, which is before the new language's messages exist — recomputing only
   * on that would read the *old* (or empty) translations and then never run
   * again, leaving the UI stuck in the previous language. `translationLoadSuccess`
   * is what says the messages are actually available.
   *
   * A counter rather than the raw events, so two emissions can never compare
   * equal and get dropped by the signal.
   */
  const revision = toSignal(
    merge(
      transloco.langChanges$,
      transloco.events$.pipe(
        filter((event) => event.type === 'translationLoadSuccess'),
      ),
    ).pipe(scan((count: number) => count + 1, 0)),
    { initialValue: 0 },
  );

  return computed(() => {
    // Read so the returned resolver is recreated whenever the available
    // translations change, which is what makes computeds built on it recompute.
    revision();
    return (
      key: string,
      fallback?: string,
      params?: Record<string, unknown>,
    ): string => {
      const value = transloco.translate<string>(key, params);
      // Transloco echoes the key back when it has no entry for it.
      return typeof value === 'string' && value !== '' && value !== key
        ? value
        : (fallback ?? key);
    };
  });
}
