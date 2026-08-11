import { InjectionToken, type Provider } from '@angular/core';

/**
 * Shape of the public marketing shell. The layout owns the chrome, the app owns
 * the copy — the same split as `DASHBOARD_MENU_CONFIG` for the dashboard
 * sidebar: add a nav entry or a footer column by editing the config object an
 * app provides, never by editing the header or footer component.
 */

/** A link in the header nav, a footer column, or the legal strip. */
export interface LandingLink {
  label: string;
  /** Router path. Use `'/'` with `fragment` for an on-page section anchor. */
  url: string;
  /** Section id to scroll to — needs `withInMemoryScrolling({ anchorScrolling: 'enabled' })`. */
  fragment?: string;
  /** Renders a plain `<a href>` with `target="_blank"` instead of a router link. */
  external?: boolean;
}

/** A call-to-action button. `variant` maps to the hlm button variants. */
export interface LandingAction extends LandingLink {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  /** Hidden below `md` so the mobile header keeps a single primary action. */
  desktopOnly?: boolean;
}

/** Dismissible strip above the header. Omit it and nothing renders. */
export interface LandingAnnouncement {
  message: string;
  link?: LandingLink;
  /** Defaults to true; the dismissal is remembered per browser under `id`. */
  dismissible?: boolean;
  /** Storage key for the dismissal. Bump it to re-show a changed message. */
  id?: string;
}

/** Pre-footer conversion band, rendered on every page of the layout. */
export interface LandingCallToAction {
  eyebrow?: string;
  heading: string;
  description?: string;
  actions: LandingAction[];
  /** Small reassurance line under the buttons. */
  note?: string;
}

export interface LandingFooterColumn {
  label: string;
  links: LandingLink[];
}

/** Icons are `@ng-icons/lucide` names; the footer registers the set in `LANDING_SOCIAL_ICONS`. */
export interface LandingSocialLink {
  label: string;
  url: string;
  icon: string;
}

export interface LandingNewsletter {
  heading: string;
  description?: string;
  placeholder?: string;
  cta?: string;
}

export interface LandingFooter {
  description?: string;
  columns: LandingFooterColumn[];
  socials?: LandingSocialLink[];
  legal?: LandingLink[];
  newsletter?: LandingNewsletter;
  /** `{year}` is replaced with the current year. */
  copyright?: string;
}

export interface LandingBrand {
  name: string;
  /** `@ng-icons/lucide` name; the header registers the set in `LANDING_BRAND_ICONS`. */
  icon?: string;
  tagline?: string;
  /** Where the logo links to. Defaults to `/`. */
  url?: string;
}

export interface LandingConfig {
  brand: LandingBrand;
  nav: LandingLink[];
  actions: LandingAction[];
  announcement?: LandingAnnouncement;
  cta?: LandingCallToAction;
  footer: LandingFooter;
}

export const LANDING_CONFIG = new InjectionToken<LandingConfig>('LANDING_CONFIG');

/** Provide the marketing shell's content. Call once in an app's `app.config.ts`. */
export function provideLandingLayout(config: LandingConfig): Provider {
  return { provide: LANDING_CONFIG, useValue: config };
}
