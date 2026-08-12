import { ChangeDetectionStrategy, Component } from '@angular/core';
import { LandingSection } from '@kuetelabs/frontend/layouts/landing-layout';

/** Numbers band. Dummy figures — replace before anyone reads them as a claim. */
@Component({
  selector: 'app-landing-metrics',
  imports: [LandingSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <lib-landing-section>
      <dl class="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
        @for (metric of metrics; track metric.label) {
          <div class="flex flex-col gap-2">
            <dt class="text-muted-foreground order-2 text-sm">{{ metric.label }}</dt>
            <dd class="order-1 text-4xl font-semibold tracking-tight">{{ metric.value }}</dd>
          </div>
        }
      </dl>
    </lib-landing-section>
  `,
})
export class LandingMetrics {
  protected readonly metrics = [
    { value: '12k+', label: 'Teams building on Nimbus' },
    { value: '99.98%', label: 'Rolling 90-day uptime' },
    { value: '38 ms', label: 'Median API response' },
    { value: '4.9/5', label: 'Average customer rating' },
  ];
}
