import type { LandingConfig } from '@kuetelabs/frontend/layouts/landing-layout';

/**
 * Every word the marketing shell renders lives here — the same split as
 * `dashboardMenu`: the layout owns the chrome, the app owns the copy.
 *
 * The copy fields hold **translation keys**, not sentences: `landing-layout`
 * resolves each one through `injectCopyResolver()` and falls back to the raw
 * string when there is no entry for it. So an app with no i18n can still put
 * literal text here and it renders unchanged — see `src/app/i18n/en.json` for
 * the values these keys map to.
 *
 * All of it is placeholder content for a fictional product ("Nimbus"). Replace
 * the strings; you should not need to touch a component in `landing-layout`.
 * Icon names must come from `LANDING_BRAND_ICONS` / `LANDING_SOCIAL_ICONS`.
 */
export const landingConfig: LandingConfig = {
  brand: {
    // A product name, not copy — the same in every language.
    name: 'Nimbus',
    icon: 'lucideHexagon',
    tagline: 'landing.brand.tagline',
    url: '/',
  },

  nav: [
    { label: 'landing.nav.features', url: '/', fragment: 'features' },
    { label: 'landing.nav.howItWorks', url: '/', fragment: 'how-it-works' },
    { label: 'landing.nav.customers', url: '/', fragment: 'customers' },
    { label: 'landing.nav.pricing', url: '/', fragment: 'pricing' },
    { label: 'landing.nav.faq', url: '/', fragment: 'faq' },
    { label: 'landing.nav.blog', url: '/blog' },
    { label: 'landing.nav.contact', url: '/contact' },
  ],

  actions: [
    {
      label: 'landing.actions.signIn',
      url: '/auth/login',
      variant: 'ghost',
      desktopOnly: true,
    },
    { label: 'landing.actions.startFree', url: '/auth/signup' },
  ],

  announcement: {
    id: 'nimbus-2026-realtime',
    message: 'landing.announcement.message',
    link: { label: 'landing.announcement.link', url: '/', fragment: 'features' },
    dismissible: true,
  },

  cta: {
    eyebrow: 'landing.cta.eyebrow',
    heading: 'landing.cta.heading',
    description: 'landing.cta.description',
    actions: [
      { label: 'landing.actions.startFree', url: '/auth/signup' },
      { label: 'landing.actions.talkToSales', url: '/contact', variant: 'outline' },
    ],
    note: 'landing.cta.note',
  },

  footer: {
    description: 'landing.footer.description',
    columns: [
      {
        label: 'landing.footer.columns.product',
        links: [
          { label: 'landing.footer.links.features', url: '/', fragment: 'features' },
          { label: 'landing.footer.links.howItWorks', url: '/', fragment: 'how-it-works' },
          { label: 'landing.footer.links.pricing', url: '/', fragment: 'pricing' },
          { label: 'landing.footer.links.changelog', url: '/', fragment: 'features' },
        ],
      },
      {
        label: 'landing.footer.columns.company',
        links: [
          { label: 'landing.footer.links.customers', url: '/', fragment: 'customers' },
          { label: 'landing.footer.links.contact', url: '/contact' },
          { label: 'landing.footer.links.careers', url: '/contact' },
          { label: 'landing.footer.links.brandKit', url: '/contact' },
        ],
      },
      {
        label: 'landing.footer.columns.resources',
        links: [
          { label: 'landing.footer.links.documentation', url: '/', fragment: 'faq' },
          { label: 'landing.footer.links.apiReference', url: '/', fragment: 'faq' },
          { label: 'landing.footer.links.status', url: 'https://example.com/status', external: true },
          {
            label: 'landing.footer.links.community',
            url: 'https://example.com/community',
            external: true,
          },
        ],
      },
    ],
    // Network names are brands; they stay as they are in every language.
    socials: [
      { label: 'GitHub', url: 'https://example.com/github', icon: 'lucideGithub' },
      { label: 'X', url: 'https://example.com/x', icon: 'lucideTwitter' },
      { label: 'LinkedIn', url: 'https://example.com/linkedin', icon: 'lucideLinkedin' },
      { label: 'RSS', url: 'https://example.com/rss', icon: 'lucideRss' },
    ],
    legal: [
      { label: 'landing.footer.legal.privacy', url: '/contact' },
      { label: 'landing.footer.legal.terms', url: '/contact' },
      { label: 'landing.footer.legal.security', url: '/contact' },
    ],
    newsletter: {
      heading: 'landing.footer.newsletter.heading',
      description: 'landing.footer.newsletter.description',
      placeholder: 'landing.footer.newsletter.placeholder',
      cta: 'landing.footer.newsletter.cta',
    },
    copyright: 'landing.footer.copyright',
  },
};
