import type { LandingConfig } from '@kuetelabs/frontend/layouts/landing-layout';

/**
 * Every word the marketing shell renders lives here — the same split as
 * `dashboardMenu`: the layout owns the chrome, the app owns the copy.
 *
 * All of it is placeholder content for a fictional product ("Nimbus"). Replace
 * the strings; you should not need to touch a component in `landing-layout`.
 * Icon names must come from `LANDING_BRAND_ICONS` / `LANDING_SOCIAL_ICONS`.
 */
export const landingConfig: LandingConfig = {
  brand: {
    name: 'Nimbus',
    icon: 'lucideHexagon',
    tagline: 'The product platform',
    url: '/',
  },

  nav: [
    { label: 'Features', url: '/', fragment: 'features' },
    { label: 'How it works', url: '/', fragment: 'how-it-works' },
    { label: 'Customers', url: '/', fragment: 'customers' },
    { label: 'Pricing', url: '/', fragment: 'pricing' },
    { label: 'FAQ', url: '/', fragment: 'faq' },
    { label: 'Contact', url: '/contact' },
  ],

  actions: [
    { label: 'Sign in', url: '/auth/login', variant: 'ghost', desktopOnly: true },
    { label: 'Start free', url: '/auth/signup' },
  ],

  announcement: {
    id: 'nimbus-2026-realtime',
    message: 'Realtime notifications and audit exports are out of beta.',
    link: { label: 'Read the changelog', url: '/', fragment: 'features' },
    dismissible: true,
  },

  cta: {
    eyebrow: 'Get started',
    heading: 'Ship the feature, skip the platform work',
    description:
      'Auth, roles, audit trails, and dashboards on day one. Bring your own Postgres and keep every migration you already wrote.',
    actions: [
      { label: 'Start free', url: '/auth/signup' },
      { label: 'Talk to sales', url: '/contact', variant: 'outline' },
    ],
    note: 'Free for up to 5 people. No card, no sales call.',
  },

  footer: {
    description:
      'Nimbus gives product teams the plumbing every application needs — identity, permissions, notifications, and reporting — so the roadmap stays about the product.',
    columns: [
      {
        label: 'Product',
        links: [
          { label: 'Features', url: '/', fragment: 'features' },
          { label: 'How it works', url: '/', fragment: 'how-it-works' },
          { label: 'Pricing', url: '/', fragment: 'pricing' },
          { label: 'Changelog', url: '/', fragment: 'features' },
        ],
      },
      {
        label: 'Company',
        links: [
          { label: 'Customers', url: '/', fragment: 'customers' },
          { label: 'Contact', url: '/contact' },
          { label: 'Careers', url: '/contact' },
          { label: 'Brand kit', url: '/contact' },
        ],
      },
      {
        label: 'Resources',
        links: [
          { label: 'Documentation', url: '/', fragment: 'faq' },
          { label: 'API reference', url: '/', fragment: 'faq' },
          { label: 'Status', url: 'https://example.com/status', external: true },
          { label: 'Community', url: 'https://example.com/community', external: true },
        ],
      },
    ],
    socials: [
      { label: 'GitHub', url: 'https://example.com/github', icon: 'lucideGithub' },
      { label: 'X', url: 'https://example.com/x', icon: 'lucideTwitter' },
      { label: 'LinkedIn', url: 'https://example.com/linkedin', icon: 'lucideLinkedin' },
      { label: 'RSS', url: 'https://example.com/rss', icon: 'lucideRss' },
    ],
    legal: [
      { label: 'Privacy', url: '/contact' },
      { label: 'Terms', url: '/contact' },
      { label: 'Security', url: '/contact' },
    ],
    newsletter: {
      heading: 'Release notes, monthly',
      description: 'What shipped and what broke. No drip campaign, unsubscribe in one click.',
      placeholder: 'you@company.com',
      cta: 'Subscribe',
    },
    copyright: '© {year} Nimbus Labs. All rights reserved.',
  },
};
