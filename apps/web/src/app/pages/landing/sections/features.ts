import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideGauge,
  lucideKeyRound,
  lucideShieldCheck,
  lucideTrendingUp,
  lucideWorkflow,
} from '@ng-icons/lucide';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { LandingSection } from '@kuetelabs/frontend/layouts/landing-layout';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';

interface Feature {
  /** Keys `landing.features.items.<id>.title` / `.description`. */
  id: string;
  icon: string;
}

/** Capability grid — the "what you get" section. */
@Component({
  selector: 'app-landing-features',
  imports: [LandingSection, TranslocoDirective, NgIcon, HlmIcon, ...HlmCardImports],
  providers: [
    provideIcons({
      lucideKeyRound,
      lucideShieldCheck,
      lucideBell,
      lucideTrendingUp,
      lucideWorkflow,
      lucideGauge,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <lib-landing-section
        id="features"
        [eyebrow]="t('landing.features.eyebrow')"
        [heading]="t('landing.features.heading')"
        [description]="t('landing.features.description')"
      >
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          @for (feature of features; track feature.id) {
            <section hlmCard class="h-full transition-shadow hover:shadow-md">
              <div hlmCardHeader>
                <span
                  class="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg"
                >
                  <ng-icon hlm [name]="feature.icon" size="sm" />
                </span>
                <h3 hlmCardTitle>{{ t('landing.features.items.' + feature.id + '.title') }}</h3>
                <p hlmCardDescription>
                  {{ t('landing.features.items.' + feature.id + '.description') }}
                </p>
              </div>
            </section>
          }
        </div>
      </lib-landing-section>
    </ng-container>
  `,
})
export class LandingFeatures {
  /** Order and icons live here; the words live in `src/app/i18n/*.json`. */
  protected readonly features: Feature[] = [
    { id: 'auth', icon: 'lucideKeyRound' },
    { id: 'roles', icon: 'lucideShieldCheck' },
    { id: 'notifications', icon: 'lucideBell' },
    { id: 'analytics', icon: 'lucideTrendingUp' },
    { id: 'automations', icon: 'lucideWorkflow' },
    { id: 'performance', icon: 'lucideGauge' },
  ];
}
