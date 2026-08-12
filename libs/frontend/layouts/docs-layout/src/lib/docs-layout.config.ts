import { InjectionToken, type Provider, type Type } from '@angular/core';
import { DOCS_MENU_CONFIG, type DocsNavConfig } from './docs-navigation.model';

export interface DocsLayoutConfig {
  /** Wordmark in the header. */
  title: string;
  /** Rendered as a badge next to the title — `v2.1`, `beta`. Hidden when unset. */
  version?: string;
  /** Where the wordmark links. */
  homePath: string;
  /** Repository link in the header. Hidden when unset. */
  repositoryUrl?: string;
  /**
   * Base URL for "Edit this page". The current route path and `editFileExtension`
   * are appended, so `https://github.com/org/repo/edit/main/content` plus the route
   * `/docs/guide/install` gives `.../content/docs/guide/install.md`. Hidden when unset.
   */
  editBaseUrl?: string;
  editFileExtension: string;
  /** The "On this page" rail. */
  tocEnabled: boolean;
  /** Heading levels collected into the TOC. */
  tocLevels: (2 | 3 | 4)[];
  /** Below this many headings the rail is noise, so it is not rendered. */
  tocMinHeadings: number;
  /** Prev/next pager under the article. */
  pagerEnabled: boolean;
  /**
   * Distance from the viewport top that counts as "at the heading", in px. Must
   * clear the sticky header — it drives both anchor scroll offset and scroll-spy.
   */
  scrollOffset: number;
}

const DEFAULTS: DocsLayoutConfig = {
  title: 'Documentation',
  homePath: '/',
  editFileExtension: '.md',
  tocEnabled: true,
  tocLevels: [2, 3],
  tocMinHeadings: 2,
  pagerEnabled: true,
  scrollOffset: 96,
};

export const DOCS_LAYOUT_CONFIG = new InjectionToken<DocsLayoutConfig>(
  'DOCS_LAYOUT_CONFIG',
  {
    providedIn: 'root',
    factory: () => DEFAULTS,
  },
);

/**
 * Components rendered at the right of the docs header — a theme toggle, a search
 * trigger, a sign-in button.
 *
 * A token rather than content projection for the same reason the dashboard uses one:
 * the layout is a *routed* component, so there is no parent template to project into.
 * It also keeps this lib free of feature dependencies — the docs shell must render
 * on a site with no Supabase configured.
 */
export const DOCS_HEADER_ACTIONS = new InjectionToken<Type<unknown>[]>(
  'DOCS_HEADER_ACTIONS',
  {
    providedIn: 'root',
    factory: () => [],
  },
);

/** Convenience provider so an app overrides only what differs, plus its docs tree. */
export function provideDocsLayout(
  config: Partial<DocsLayoutConfig> & {
    navigation?: DocsNavConfig;
    headerActions?: Type<unknown>[];
  } = {},
): Provider[] {
  const { navigation, headerActions, ...layout } = config;

  const providers: Provider[] = [
    {
      provide: DOCS_LAYOUT_CONFIG,
      useValue: { ...DEFAULTS, ...layout } satisfies DocsLayoutConfig,
    },
  ];

  if (navigation) {
    providers.push({ provide: DOCS_MENU_CONFIG, useValue: navigation });
  }
  if (headerActions) {
    providers.push({ provide: DOCS_HEADER_ACTIONS, useValue: headerActions });
  }

  return providers;
}
