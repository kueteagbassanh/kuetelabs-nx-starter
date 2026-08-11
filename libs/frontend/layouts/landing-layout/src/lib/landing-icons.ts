import {
  lucideBlocks,
  lucideBoxes,
  lucideFacebook,
  lucideGithub,
  lucideHexagon,
  lucideInstagram,
  lucideLayers,
  lucideLinkedin,
  lucideMail,
  lucideRocket,
  lucideRss,
  lucideSlack,
  lucideSparkles,
  lucideTwitter,
  lucideYoutube,
  lucideZap,
} from '@ng-icons/lucide';

/**
 * `LandingConfig` carries icons as plain strings, so the layout has to register
 * every name an app might use up front. These are the two sets it registers —
 * a config referencing anything outside them will not render. Add the icon here
 * (not in the app) when a new one is needed.
 */

/** Logo marks available to `brand.icon`. */
export const LANDING_BRAND_ICONS = {
  lucideZap,
  lucideLayers,
  lucideHexagon,
  lucideSparkles,
  lucideBoxes,
  lucideBlocks,
  lucideRocket,
} as const;

/** Icons available to `footer.socials[].icon`. */
export const LANDING_SOCIAL_ICONS = {
  lucideGithub,
  lucideTwitter,
  lucideLinkedin,
  lucideYoutube,
  lucideInstagram,
  lucideFacebook,
  lucideSlack,
  lucideMail,
  lucideRss,
} as const;
