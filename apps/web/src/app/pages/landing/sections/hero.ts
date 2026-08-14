import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideCircleCheck, lucidePlay, lucideSparkles } from '@ng-icons/lucide';
import { HlmBadgeImports } from '@kuetelabs/frontend/ui/components/badge';
import { HlmButtonImports } from '@kuetelabs/frontend/ui/components/button';
import { HlmIcon } from '@kuetelabs/frontend/ui/components/icon';
import { AreaChart, type ChartSeries, compactFormatter } from '@kuetelabs/frontend/ui/charts';
import { TranslocoDirective, injectCopyResolver } from '@kuetelabs/frontend/ui/i18n';

interface UsageRow extends Record<string, unknown> {
  week: string;
  runs: number;
  reviews: number;
}

/**
 * Above-the-fold pitch plus a product preview.
 *
 * The preview is a real chart from the shared charts lib, so the marketing page
 * and the dashboard cannot drift apart visually. It needs the DOM, hence the
 * `isBrowser` guard — without it `nx build web` fails at the prerender step.
 */
@Component({
  selector: 'app-landing-hero',
  imports: [
    RouterLink,
    TranslocoDirective,
    NgIcon,
    HlmIcon,
    AreaChart,
    ...HlmButtonImports,
    ...HlmBadgeImports,
  ],
  providers: [provideIcons({ lucideArrowRight, lucideSparkles, lucideCircleCheck, lucidePlay })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block overflow-hidden' },
  template: `
    <div
      class="from-primary/10 pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-linear-to-b via-transparent to-transparent"
      aria-hidden="true"
    ></div>

    <div
      class="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28"
      *transloco="let t"
    >
      <div class="flex flex-col items-start gap-6">
        <span hlmBadge variant="secondary" class="gap-1.5">
          <ng-icon hlm name="lucideSparkles" size="xs" />
          {{ t('landing.hero.badge') }}
        </span>

        <!-- Two keys rather than one with markup: the accent colour lands on a
             different fragment in each language, so the split has to be a
             translated boundary, not a hard-coded one. -->
        <h1 class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
          {{ t('landing.hero.titleLead') }}
          <span class="text-primary">{{ t('landing.hero.titleAccent') }}</span>
        </h1>

        <p class="text-muted-foreground max-w-xl text-lg text-pretty">
          {{ t('landing.hero.description') }}
        </p>

        <div class="flex flex-col gap-3 sm:flex-row">
          <a hlmBtn size="lg" routerLink="/auth/signup">
            {{ t('landing.hero.ctaPrimary') }}
            <ng-icon hlm name="lucideArrowRight" size="sm" data-icon="inline-end" />
          </a>
          <a hlmBtn size="lg" variant="outline" routerLink="/" fragment="how-it-works">
            <ng-icon hlm name="lucidePlay" size="sm" data-icon="inline-start" />
            {{ t('landing.hero.ctaSecondary') }}
          </a>
        </div>

        <ul class="text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          @for (proof of proofPoints; track proof) {
            <li class="flex items-center gap-1.5">
              <ng-icon hlm name="lucideCircleCheck" size="xs" class="text-primary" />
              {{ t('landing.hero.proof.' + proof) }}
            </li>
          }
        </ul>
      </div>

      <div class="relative">
        <div
          class="border-border/60 bg-card/80 rounded-2xl border p-4 shadow-xl backdrop-blur sm:p-6"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-muted-foreground text-xs tracking-widest uppercase">
                {{ t('landing.hero.preview.period') }}
              </p>
              <p class="mt-1 text-2xl font-semibold">{{ t('landing.hero.preview.runs') }}</p>
            </div>
            <span hlmBadge variant="secondary">{{ t('landing.hero.preview.delta') }}</span>
          </div>

          <div class="mt-6">
            @if (isBrowser) {
              <lib-area-chart
                [data]="usage()"
                [series]="usageSeries()"
                [stacked]="true"
                [yFormatter]="compact"
              />
            } @else {
              <div class="bg-muted/40 h-[220px] animate-pulse rounded-lg"></div>
            }
          </div>

          <dl class="mt-6 grid grid-cols-3 gap-4 border-t pt-4">
            @for (stat of previewStats; track stat.id) {
              <div>
                <dt class="text-muted-foreground text-xs">
                  {{ t('landing.hero.stats.' + stat.id) }}
                </dt>
                <dd class="mt-1 text-sm font-medium">{{ stat.value }}</dd>
              </div>
            }
          </dl>
        </div>
      </div>
    </div>
  `,
})
export class LandingHero {
  protected readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly t = injectCopyResolver();

  /** Ids; the words are `landing.hero.proof.<id>`. */
  protected readonly proofPoints = ['noCard', 'soc2', 'deploy'];

  /** Ids and figures; the labels are `landing.hero.stats.<id>`. */
  protected readonly previewStats = [
    { id: 'latency', value: '38 ms' },
    { id: 'uptime', value: '99.98%' },
    { id: 'seats', value: '1,284' },
  ];

  protected readonly usage = signal<UsageRow[]>([
    { week: 'W1', runs: 186, reviews: 80 },
    { week: 'W2', runs: 233, reviews: 96 },
    { week: 'W3', runs: 305, reviews: 142 },
    { week: 'W4', runs: 287, reviews: 168 },
    { week: 'W5', runs: 372, reviews: 191 },
    { week: 'W6', runs: 441, reviews: 226 },
  ]);

  /**
   * A computed, not a constant: these labels are rendered by the chart itself
   * (legend and tooltip), so the template's `t` never reaches them and they have
   * to be re-resolved when the language changes.
   */
  protected readonly usageSeries = computed<ChartSeries[]>(() => {
    const t = this.t();
    return [
      { key: 'runs', label: t('landing.hero.series.runs') },
      { key: 'reviews', label: t('landing.hero.series.reviews') },
    ];
  });

  protected readonly compact = compactFormatter();
}
