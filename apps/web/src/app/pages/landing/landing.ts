import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LandingFaq } from './sections/faq';
import { LandingFeatures } from './sections/features';
import { LandingHero } from './sections/hero';
import { LandingHowItWorks } from './sections/how-it-works';
import { LandingLogoCloud } from './sections/logo-cloud';
import { LandingMetrics } from './sections/metrics';
import { LandingPricing } from './sections/pricing';
import { LandingTestimonials } from './sections/testimonials';

/**
 * The marketing home page — an ordered stack of sections, nothing else.
 *
 * Each section is its own component so copy changes stay local and the page
 * reads as its own outline. The chrome around it (header, footer, closing CTA)
 * belongs to `LandingLayout`, and the section ids here are what the header's
 * anchor links point at.
 */
@Component({
  selector: 'app-landing',
  imports: [
    LandingHero,
    LandingLogoCloud,
    LandingFeatures,
    LandingHowItWorks,
    LandingMetrics,
    LandingTestimonials,
    LandingPricing,
    LandingFaq,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-landing-hero />
    <app-landing-logo-cloud />
    <app-landing-features />
    <app-landing-how-it-works />
    <app-landing-metrics />
    <app-landing-testimonials />
    <app-landing-pricing />
    <app-landing-faq />
  `,
})
export class Landing {}
