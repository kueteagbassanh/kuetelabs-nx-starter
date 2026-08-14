import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LandingSection } from '@kuetelabs/frontend/layouts/landing-layout';
import { TranslocoDirective } from '@kuetelabs/frontend/ui/i18n';

/** Numbers band. Dummy figures — replace before anyone reads them as a claim. */
@Component({
  selector: 'app-landing-metrics',
  imports: [LandingSection, TranslocoDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-landing-section>
      <dl class="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4" *transloco="let t">
        @for (metric of metrics; track metric.id) {
          <div class="flex flex-col gap-2">
            <dt class="text-muted-foreground order-2 text-sm">
              {{ t('landing.metrics.' + metric.id) }}
            </dt>
            <dd class="order-1 text-4xl font-semibold tracking-tight">{{ metric.value }}</dd>
          </div>
        }
      </dl>
    </lib-landing-section>
  `,
})
export class LandingMetrics {
  /**
   * `id` keys the label in the message files; `value` is a figure, which reads
   * the same in every language here. A locale that formats numbers differently
   * would move these into the translation files too.
   */
  protected readonly metrics = [
    { id: 'teams', value: '12k+' },
    { id: 'uptime', value: '99.98%' },
    { id: 'latency', value: '38 ms' },
    { id: 'rating', value: '4.9/5' },
  ];
}
