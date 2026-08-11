import { DestroyRef, PLATFORM_ID, computed, effect, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'kuetelabs-theme';

interface ThemeState {
  mode: ThemeMode;
  /** Tracks `prefers-color-scheme`; only meaningful when `mode` is `'system'`. */
  systemPrefersDark: boolean;
}

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    // Private mode / blocked storage — fall back to following the OS.
    return 'system';
  }
}

/**
 * Light/dark switching for the public shell.
 *
 * The theme is a single `dark` class on `<html>`, which lives outside Angular's
 * DOM, so toggling it cannot cause a hydration mismatch. Nothing runs on the
 * server: SSR renders the light palette and `index.html`'s inline bootstrap
 * script re-applies the stored choice before first paint, so there is no flash.
 */
export const ThemeStore = signalStore(
  { providedIn: 'root' },
  withState<ThemeState>({ mode: 'system', systemPrefersDark: false }),
  withComputed(({ mode, systemPrefersDark }) => ({
    isDark: computed(() => mode() === 'dark' || (mode() === 'system' && systemPrefersDark())),
  })),
  withMethods((store) => ({
    setMode(mode: ThemeMode): void {
      patchState(store, { mode });
    },
    /** Flips to the opposite of what is currently on screen, leaving `'system'`. */
    toggle(): void {
      patchState(store, { mode: store.isDark() ? 'light' : 'dark' });
    },
  })),
  withHooks({
    onInit(store) {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) {
        return;
      }

      const media = window.matchMedia('(prefers-color-scheme: dark)');
      patchState(store, { mode: readStoredMode(), systemPrefersDark: media.matches });

      const onSystemChange = (event: MediaQueryListEvent): void =>
        patchState(store, { systemPrefersDark: event.matches });
      media.addEventListener('change', onSystemChange);
      inject(DestroyRef).onDestroy(() => media.removeEventListener('change', onSystemChange));

      effect(() => {
        const mode = store.mode();
        document.documentElement.classList.toggle('dark', store.isDark());
        try {
          if (mode === 'system') {
            localStorage.removeItem(STORAGE_KEY);
          } else {
            localStorage.setItem(STORAGE_KEY, mode);
          }
        } catch {
          // Storage is optional: the toggle still works for this page view.
        }
      });
    },
  }),
);
