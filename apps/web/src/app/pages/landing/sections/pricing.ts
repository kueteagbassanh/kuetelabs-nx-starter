import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@kuetelabs/frontend/ui/components/badge';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { LandingSection } from '@kuetelabs/frontend/layouts/landing-layout';

interface Plan {
  name: string;
  description: string;
  monthly: number | null;
  features: string[];
  cta: string;
  route: string;
  featured?: boolean;
}

/** Three tiers with a monthly/yearly switch. Prices are placeholders. */
@Component({
  selector: 'app-landing-pricing',
  imports: [
    LandingSection,
    RouterLink,
    NgIcon,
    HlmIcon,
    ...HlmCardImports,
    ...HlmButtonImports,
    ...HlmBadgeImports,
  ],
  providers: [provideIcons({ lucideCheck })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-landing-section
      id="pricing"
      eyebrow="Pricing"
      heading="Priced per seat, not per surprise"
      description="Every plan includes the full platform. You pay for the size of your team and the scale of your workload — nothing is gated behind a sales call except the things that genuinely need one."
    >
      <div class="flex flex-col items-center gap-10">
        <div
          class="bg-muted/60 inline-flex items-center rounded-lg p-1"
          role="group"
          aria-label="Billing period"
        >
          @for (period of periods; track period.id) {
            <button
              hlmBtn
              size="sm"
              type="button"
              [variant]="billing() === period.id ? 'default' : 'ghost'"
              [attr.aria-pressed]="billing() === period.id"
              (click)="billing.set(period.id)"
            >
              {{ period.label }}
            </button>
          }
        </div>

        <div class="grid w-full gap-4 lg:grid-cols-3">
          @for (plan of plans; track plan.name) {
            <section
              hlmCard
              class="flex h-full flex-col"
              [class.ring-primary]="plan.featured"
              [class.ring-2]="plan.featured"
              [class.shadow-lg]="plan.featured"
            >
              <div hlmCardHeader>
                <h3 hlmCardTitle>{{ plan.name }}</h3>
                <p hlmCardDescription>{{ plan.description }}</p>
                @if (plan.featured) {
                  <!-- hlmCard is overflow-hidden, so the badge sits in the
                       header's action slot rather than outside the card edge. -->
                  <span hlmCardAction><span hlmBadge>Most popular</span></span>
                }
              </div>

              <div hlmCardContent class="flex-1">
                <p class="flex items-baseline gap-1">
                  @if (plan.monthly === null) {
                    <span class="text-3xl font-semibold tracking-tight">Custom</span>
                  } @else {
                    <span class="text-4xl font-semibold tracking-tight">
                      {{ price(plan.monthly) }}
                    </span>
                    <span class="text-muted-foreground text-sm">/ seat / month</span>
                  }
                </p>

                @if (plan.monthly !== null && billing() === 'yearly') {
                  <p class="text-muted-foreground mt-1 text-xs">Billed yearly — two months free.</p>
                }

                <ul class="mt-6 flex flex-col gap-3 text-sm">
                  @for (feature of plan.features; track feature) {
                    <li class="flex items-start gap-2">
                      <ng-icon hlm name="lucideCheck" size="xs" class="text-primary mt-1 shrink-0" />
                      <span class="text-muted-foreground">{{ feature }}</span>
                    </li>
                  }
                </ul>
              </div>

              <div hlmCardFooter>
                <a
                  hlmBtn
                  class="w-full"
                  [variant]="plan.featured ? 'default' : 'outline'"
                  [routerLink]="plan.route"
                >
                  {{ plan.cta }}
                </a>
              </div>
            </section>
          }
        </div>
      </div>
    </lib-landing-section>
  `,
})
export class LandingPricing {
  protected readonly billing = signal<'monthly' | 'yearly'>('monthly');

  protected readonly periods = [
    { id: 'monthly' as const, label: 'Monthly' },
    { id: 'yearly' as const, label: 'Yearly · save 17%' },
  ];

  /** Yearly is ten months' worth of monthly, rounded to the nearest dollar. */
  protected readonly discount = computed(() => (this.billing() === 'yearly' ? 10 / 12 : 1));

  protected price(monthly: number): string {
    return `$${Math.round(monthly * this.discount())}`;
  }

  protected readonly plans: Plan[] = [
    {
      name: 'Starter',
      description: 'For the first few engineers and the first real customers.',
      monthly: 0,
      features: [
        'Up to 5 team members',
        'Email and OAuth sign-in',
        '10k automated runs / month',
        'Community support',
      ],
      cta: 'Start free',
      route: '/auth/signup',
    },
    {
      name: 'Growth',
      description: 'For teams with customers who notice when something breaks.',
      monthly: 24,
      features: [
        'Unlimited team members',
        'Custom roles and permissions',
        '1M automated runs / month',
        'Realtime notifications and webhooks',
        'Audit log with 1-year retention',
        'Priority support',
      ],
      cta: 'Start 14-day trial',
      route: '/auth/signup',
      featured: true,
    },
    {
      name: 'Enterprise',
      description: 'For organisations with a procurement process and a runbook.',
      monthly: null,
      features: [
        'SSO and SCIM provisioning',
        'Data residency options',
        'Unlimited runs, custom rate limits',
        '99.99% uptime SLA',
        'Dedicated solutions engineer',
      ],
      cta: 'Talk to sales',
      route: '/contact',
    },
  ];
}
