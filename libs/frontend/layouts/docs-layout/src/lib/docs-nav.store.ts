import { computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import {
  DOCS_MENU_CONFIG,
  type DocsNavConfig,
  type DocsNavLink,
  type DocsNavSection,
} from './docs-navigation.model';

interface DocsNavState {
  config: DocsNavConfig;
}

/** Compares route paths without their query string, fragment, or trailing slash. */
function normalize(url: string): string {
  const path = url.split(/[?#]/)[0];
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

function findLink(
  sections: DocsNavSection[],
  label: string,
): DocsNavLink | undefined {
  for (const section of sections) {
    const found = section.items.find((item) => item.label === label);
    if (found) {
      return found;
    }
  }
  return undefined;
}

/**
 * Runtime state of the docs navigation: the tree an app provided, plus everything
 * derived from where the reader currently is.
 *
 * Seeded from DOCS_MENU_CONFIG and cloned — badges are mutated at runtime and the
 * injected config is shared, so writing through it would leak one app's state into
 * another's provider value (same reason as SidebarStore).
 */
export const DocsNavStore = signalStore(
  { providedIn: 'root' },
  withState(
    () =>
      ({ config: structuredClone(inject(DOCS_MENU_CONFIG)) }) as DocsNavState,
  ),

  withProps(() => {
    const router = inject(Router);
    return {
      _currentUrl: toSignal(
        router.events.pipe(
          filter(
            (event): event is NavigationEnd => event instanceof NavigationEnd,
          ),
          map((event) => event.urlAfterRedirects),
        ),
        // NavigationEnd only fires on the *next* navigation, so seed with where we
        // already are — otherwise the first page renders with nothing marked active.
        { initialValue: router.url },
      ),
    };
  }),

  withComputed((store) => {
    const sections = computed(() => store.config().sections);

    /** Reading order: internal links only, in sidebar order. */
    const pages = computed(() =>
      sections().flatMap((section) =>
        section.items
          .filter((item) => !item.external)
          .map((item) => ({ ...item, section: section.label })),
      ),
    );

    const currentPath = computed(() => normalize(store._currentUrl()));
    const activeIndex = computed(() =>
      pages().findIndex((p) => normalize(p.path) === currentPath()),
    );

    return {
      sections,
      pages,
      currentPath,
      activeIndex,
      // Index, not `.at()`: a route outside the tree gives -1, and `.at(-1)` would
      // report the last page as the one being read.
      activeLink: computed(() => {
        const index = activeIndex();
        return index < 0 ? undefined : pages()[index];
      }),
      activeSection: computed(() => {
        const index = activeIndex();
        return index < 0 ? undefined : pages()[index].section;
      }),
      /** `undefined` at the ends of the tree, and on a page that is not in it. */
      previousPage: computed(() => {
        const index = activeIndex();
        return index > 0 ? pages()[index - 1] : undefined;
      }),
      nextPage: computed(() => {
        const index = activeIndex();
        return index >= 0 && index < pages().length - 1
          ? pages()[index + 1]
          : undefined;
      }),
    };
  }),

  withMethods((store) => {
    const mutate = (change: (config: DocsNavConfig) => void): void => {
      const next = structuredClone(store.config());
      change(next);
      patchState(store, { config: next });
    };

    return {
      /** Swaps the whole tree — for docs loaded from a CMS or a manifest at runtime. */
      setNavigation(config: DocsNavConfig): void {
        patchState(store, { config: structuredClone(config) });
      },

      /** Sets the badge on a link, searched by label across all sections. */
      updateBadge(linkLabel: string, badge: string | undefined): void {
        mutate((config) => {
          const link = findLink(config.sections, linkLabel);
          if (link) {
            link.badge = badge;
          }
        });
      },
    };
  }),
);
