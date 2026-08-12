import { InjectionToken } from '@angular/core';

/**
 * One page in the docs sidebar.
 *
 * `path` is an **absolute route path** (`/docs/installation`), never a relative
 * segment. The sidebar feeds it straight to `routerLink`, and the pager finds the
 * current page by comparing it to the router URL — a relative path would have to be
 * resolved against a route the store cannot see.
 */
export interface DocsNavLink {
  label: string;
  path: string;
  /** Short marker after the label — `New`, `Beta`, `Deprecated`. */
  badge?: string;
  /**
   * Renders a plain anchor that opens in a new tab. External links are skipped by
   * the prev/next pager: they are not pages in the reading order.
   */
  external?: boolean;
}

export interface DocsNavSection {
  label: string;
  /** Wraps the section in a collapsible; static section header otherwise. */
  collapsible?: boolean;
  /** Only meaningful when `collapsible`. Defaults to open. */
  defaultOpen?: boolean;
  items: DocsNavLink[];
}

export interface DocsNavConfig {
  sections: DocsNavSection[];
}

/**
 * The docs tree. Apps provide it — usually through `provideDocsLayout({ navigation })`
 * — exactly as they provide `DASHBOARD_MENU_CONFIG` for the dashboard sidebar.
 *
 * Defaults to empty so the shell still renders (header, article, TOC) before an app
 * has a tree to give it.
 */
export const DOCS_MENU_CONFIG = new InjectionToken<DocsNavConfig>(
  'DOCS_MENU_CONFIG',
  {
    providedIn: 'root',
    factory: () => ({ sections: [] }),
  },
);
