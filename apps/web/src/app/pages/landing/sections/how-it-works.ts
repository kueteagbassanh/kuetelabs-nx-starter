import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideRocket, lucideTerminal, lucideUsers } from '@ng-icons/lucide';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { LandingSection } from '@kuetelabs/frontend/layouts/landing-layout';

interface Step {
  icon: string;
  title: string;
  description: string;
}

/** Three-step onboarding story, numbered and connected on large screens. */
@Component({
  selector: 'app-landing-how-it-works',
  imports: [LandingSection, NgIcon, HlmIcon],
  providers: [provideIcons({ lucideTerminal, lucideUsers, lucideRocket })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-landing-section
      id="how-it-works"
      [muted]="true"
      eyebrow="How it works"
      heading="From empty repo to production in an afternoon"
      description="No migration project, no rewrite. Point Nimbus at your database, invite your team, and keep shipping."
    >
      <ol class="relative grid gap-8 lg:grid-cols-3 lg:gap-6">
        <li
          class="bg-border/60 absolute top-6 right-0 left-0 -z-10 hidden h-px lg:block"
          aria-hidden="true"
        ></li>

        @for (step of steps; track step.title; let i = $index) {
          <li class="flex flex-col items-start gap-4 lg:pe-6">
            <span
              class="bg-background border-border ring-background flex size-12 items-center justify-center rounded-xl border ring-8"
            >
              <ng-icon hlm [name]="step.icon" size="sm" class="text-primary" />
            </span>
            <div>
              <p class="text-muted-foreground text-xs font-medium tracking-widest uppercase">
                Step {{ i + 1 }}
              </p>
              <h3 class="mt-1 text-lg font-medium">{{ step.title }}</h3>
              <p class="text-muted-foreground mt-2 text-sm leading-relaxed">
                {{ step.description }}
              </p>
            </div>
          </li>
        }
      </ol>
    </lib-landing-section>
  `,
})
export class LandingHowItWorks {
  protected readonly steps: Step[] = [
    {
      icon: 'lucideTerminal',
      title: 'Connect your data',
      description:
        'One command links your Postgres schema. Types are generated from the database, so a column rename fails the build instead of production.',
    },
    {
      icon: 'lucideUsers',
      title: 'Invite your team',
      description:
        'Assign roles from the admin console. Every grant is audited, and revoking access signs the person out everywhere.',
    },
    {
      icon: 'lucideRocket',
      title: 'Ship the product',
      description:
        'Compose your screens from the shared component library and let the platform handle the parts nobody demos.',
    },
  ];
}
