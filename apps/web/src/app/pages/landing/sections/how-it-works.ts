import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRocket, lucideTerminal, lucideUsers } from '@ng-icons/lucide';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { LandingSection } from '@kuetelabs/frontend/layouts/landing-layout';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';

interface Step {
  /** Keys `landing.howItWorks.items.<id>.title` / `.description`. */
  id: string;
  icon: string;
}

/** Three-step onboarding story, numbered and connected on large screens. */
@Component({
  selector: 'app-landing-how-it-works',
  imports: [LandingSection, TranslocoDirective, NgIcon, HlmIcon],
  providers: [provideIcons({ lucideTerminal, lucideUsers, lucideRocket })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-container *transloco="let t">
      <lib-landing-section
        id="how-it-works"
        [muted]="true"
        [eyebrow]="t('landing.howItWorks.eyebrow')"
        [heading]="t('landing.howItWorks.heading')"
        [description]="t('landing.howItWorks.description')"
      >
        <ol class="relative grid gap-8 lg:grid-cols-3 lg:gap-6">
          <li
            class="bg-border/60 absolute top-6 right-0 left-0 -z-10 hidden h-px lg:block"
            aria-hidden="true"
          ></li>

          @for (step of steps; track step.id; let i = $index) {
            <li class="flex flex-col items-start gap-4 lg:pe-6">
              <span
                class="bg-background border-border ring-background flex size-12 items-center justify-center rounded-xl border ring-8"
              >
                <ng-icon hlm [name]="step.icon" size="sm" class="text-primary" />
              </span>
              <div>
                <p class="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                  <!-- The number is a parameter, so a language that words this
                       differently ("1re étape") can reorder it freely. -->
                  {{ t('landing.howItWorks.step', { number: i + 1 }) }}
                </p>
                <h3 class="mt-1 text-lg font-medium">
                  {{ t('landing.howItWorks.items.' + step.id + '.title') }}
                </h3>
                <p class="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {{ t('landing.howItWorks.items.' + step.id + '.description') }}
                </p>
              </div>
            </li>
          }
        </ol>
      </lib-landing-section>
    </ng-container>
  `,
})
export class LandingHowItWorks {
  protected readonly steps: Step[] = [
    { id: 'connect', icon: 'lucideTerminal' },
    { id: 'invite', icon: 'lucideUsers' },
    { id: 'ship', icon: 'lucideRocket' },
  ];
}
