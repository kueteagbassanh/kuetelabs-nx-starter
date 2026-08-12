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

interface Feature {
  icon: string;
  title: string;
  description: string;
}

/** Capability grid — the "what you get" section. */
@Component({
  selector: 'app-landing-features',
  imports: [LandingSection, NgIcon, HlmIcon, ...HlmCardImports],
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
    <lib-landing-section
      id="features"
      eyebrow="Platform"
      heading="Everything the boring half of your product needs"
      description="The parts every serious app grows anyway — identity, permissions, notifications, telemetry — designed once and shared across your whole workspace."
    >
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (feature of features; track feature.title) {
          <section hlmCard class="h-full transition-shadow hover:shadow-md">
            <div hlmCardHeader>
              <span
                class="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg"
              >
                <ng-icon hlm [name]="feature.icon" size="sm" />
              </span>
              <h3 hlmCardTitle>{{ feature.title }}</h3>
              <p hlmCardDescription>{{ feature.description }}</p>
            </div>
          </section>
        }
      </div>
    </lib-landing-section>
  `,
})
export class LandingFeatures {
  protected readonly features: Feature[] = [
    {
      icon: 'lucideKeyRound',
      title: 'Auth that already works',
      description:
        'Email, OAuth, magic links, and password recovery on day one — sessions handled, invite-only or open signup by config.',
    },
    {
      icon: 'lucideShieldCheck',
      title: 'Roles and permissions',
      description:
        'Permissions ride in the token and are enforced at the database. The UI hides what a user cannot do; the row-level policy makes sure of it.',
    },
    {
      icon: 'lucideBell',
      title: 'Realtime notifications',
      description:
        'An in-app center and toasts fed by a live subscription, so a grant, a mention, or a failed job lands the moment it happens.',
    },
    {
      icon: 'lucideTrendingUp',
      title: 'Analytics you can theme',
      description:
        'Charts wired to your design tokens, so light mode, dark mode, and a rebrand are one variable change — never a redraw.',
    },
    {
      icon: 'lucideWorkflow',
      title: 'Automations and webhooks',
      description:
        'Schedule work, react to events, and fan out to third parties from a service that holds the secrets your browser should not.',
    },
    {
      icon: 'lucideGauge',
      title: 'Fast by construction',
      description:
        'Server-rendered, hydrated with event replay, and shipped as a single bundle per route — quick on the first paint and the tenth click.',
    },
  ];
}
