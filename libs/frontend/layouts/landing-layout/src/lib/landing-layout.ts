import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LandingAnnouncementBar } from './components/landing-announcement-bar';
import { LandingCta } from './components/landing-cta';
import { LandingLayoutFooter } from './components/landing-layout-footer';
import { LandingLayoutHeader } from './components/landing-layout-header';
import { LANDING_CONFIG } from './landing.model';

/**
 * Chrome for the public marketing pages: announcement bar, sticky header, the
 * routed page, a shared call-to-action band, then the footer.
 *
 * It holds no marketing copy of its own — an app supplies all of it through
 * `provideLandingLayout(...)`, the same way the dashboard supplies its menu.
 */
@Component({
  selector: 'lib-landing-layout',
  imports: [
    RouterOutlet,
    LandingLayoutHeader,
    LandingLayoutFooter,
    LandingAnnouncementBar,
    LandingCta,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'bg-background text-foreground flex min-h-svh flex-col' },
  template: `
    <a
      href="#landing-main"
      class="bg-background focus:ring-ring sr-only rounded-md px-4 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-100 focus:ring-2"
    >
      Skip to content
    </a>

    @if (config.announcement; as announcement) {
      <lib-landing-announcement-bar [announcement]="announcement" />
    }

    <lib-landing-layout-header />

    <main id="landing-main" class="flex-1">
      <router-outlet />
    </main>

    @if (config.cta; as cta) {
      <lib-landing-cta [cta]="cta" />
    }

    <lib-landing-layout-footer />
  `,
})
export class LandingLayout {
  protected readonly config = inject(LANDING_CONFIG);
}
