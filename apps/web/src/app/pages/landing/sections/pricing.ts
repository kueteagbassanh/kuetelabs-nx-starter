import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@kuetelabs/frontend/ui/components/badge';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { LandingSection } from '@kuetelabs/frontend/layouts/landing-layout';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';

interface Plan {
  /** Keys `landing.pricing.plans.<id>.*`. */
  id: string;
  monthly: number | null;
  /**
   * Feature *ids*, resolved as `landing.pricing.plans.<id>.features.<featureId>`.
   * Ids rather than a translated array: Transloco flattens nested JSON, so an
   * array value is not reliably retrievable through the `transloco` directive.
   */
  features: string[];
  route: string;
  featured?: boolean;
}

/** Three tiers with a monthly/yearly switch. Prices are placeholders. */
@Component({
  selector: 'app-landing-pricing',
  imports: [
    LandingSection,
    TranslocoDirective,
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
    <ng-container *transloco="let t">
      <lib-landing-section
        id="pricing"
        [eyebrow]="t('landing.pricing.eyebrow')"
        [heading]="t('landing.pricing.heading')"
        [description]="t('landing.pricing.description')"
      >
        <div class="flex flex-col items-center gap-10">
          <div
            class="bg-muted/60 inline-flex items-center rounded-lg p-1"
            role="group"
            [attr.aria-label]="t('landing.pricing.billingPeriod')"
          >
            @for (period of periods; track period) {
              <button
                hlmBtn
                size="sm"
                type="button"
                [variant]="billing() === period ? 'default' : 'ghost'"
                [attr.aria-pressed]="billing() === period"
                (click)="billing.set(period)"
              >
                {{ t('landing.pricing.periods.' + period) }}
              </button>
            }
          </div>

          <div class="grid w-full gap-4 lg:grid-cols-3">
            @for (plan of plans; track plan.id) {
              <section
                hlmCard
                class="flex h-full flex-col"
                [class.ring-primary]="plan.featured"
                [class.ring-2]="plan.featured"
                [class.shadow-lg]="plan.featured"
              >
                <div hlmCardHeader>
                  <h3 hlmCardTitle>{{ t('landing.pricing.plans.' + plan.id + '.name') }}</h3>
                  <p hlmCardDescription>
                    {{ t('landing.pricing.plans.' + plan.id + '.description') }}
                  </p>
                  @if (plan.featured) {
                    <!-- hlmCard is overflow-hidden, so the badge sits in the
                         header's action slot rather than outside the card edge. -->
                    <span hlmCardAction>
                      <span hlmBadge>{{ t('landing.pricing.mostPopular') }}</span>
                    </span>
                  }
                </div>

                <div hlmCardContent class="flex-1">
                  <p class="flex items-baseline gap-1">
                    @if (plan.monthly === null) {
                      <span class="text-3xl font-semibold tracking-tight">
                        {{ t('landing.pricing.custom') }}
                      </span>
                    } @else {
                      <span class="text-4xl font-semibold tracking-tight">
                        {{ price(plan.monthly) }}
                      </span>
                      <span class="text-muted-foreground text-sm">
                        {{ t('landing.pricing.perSeat') }}
                      </span>
                    }
                  </p>

                  @if (plan.monthly !== null && billing() === 'yearly') {
                    <p class="text-muted-foreground mt-1 text-xs">
                      {{ t('landing.pricing.billedYearly') }}
                    </p>
                  }

                  <ul class="mt-6 flex flex-col gap-3 text-sm">
                    @for (feature of plan.features; track feature) {
                      <li class="flex items-start gap-2">
                        <ng-icon
                          hlm
                          name="lucideCheck"
                          size="xs"
                          class="text-primary mt-1 shrink-0"
                        />
                        <span class="text-muted-foreground">
                          {{ t('landing.pricing.plans.' + plan.id + '.features.' + feature) }}
                        </span>
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
                    {{ t('landing.pricing.plans.' + plan.id + '.cta') }}
                  </a>
                </div>
              </section>
            }
          </div>
        </div>
      </lib-landing-section>
    </ng-container>
  `,
})
export class LandingPricing {
  protected readonly billing = signal<'monthly' | 'yearly'>('monthly');

  protected readonly periods = ['monthly', 'yearly'] as const;

  /** Yearly is ten months' worth of monthly, rounded to the nearest dollar. */
  protected readonly discount = computed(() => (this.billing() === 'yearly' ? 10 / 12 : 1));

  protected price(monthly: number): string {
    return `$${Math.round(monthly * this.discount())}`;
  }

  /** Prices, ordering and routes; all wording is in `src/app/i18n/*.json`. */
  protected readonly plans: Plan[] = [
    {
      id: 'starter',
      monthly: 0,
      features: ['members', 'signin', 'runs', 'support'],
      route: '/auth/signup',
    },
    {
      id: 'growth',
      monthly: 24,
      features: ['members', 'roles', 'runs', 'realtime', 'audit', 'support'],
      route: '/auth/signup',
      featured: true,
    },
    {
      id: 'enterprise',
      monthly: null,
      features: ['sso', 'residency', 'runs', 'sla', 'engineer'],
      route: '/contact',
    },
  ];
}
