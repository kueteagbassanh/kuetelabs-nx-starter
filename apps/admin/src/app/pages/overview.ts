import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import {
  BarChart,
  DonutChart,
  compactFormatter,
  labelFormatter,
  type ChartSegment,
  type ChartSeries,
} from '@kuetelabs/frontend/ui/charts';

interface SignupRow extends Record<string, unknown> {
  month: string;
  signups: number;
}

/**
 * Demo admin page — proves the layout, theme, card, and chart libs are app-agnostic.
 * Replace with real admin features; delete the demo data.
 */
@Component({
  selector: 'admin-overview',
  imports: [...HlmCardImports, BarChart, DonutChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 p-4">
      <div class="grid gap-4 md:grid-cols-3">
        @for (stat of stats; track stat.label) {
          <section hlmCard>
            <div hlmCardHeader>
              <p hlmCardDescription>{{ stat.label }}</p>
              <h3 hlmCardTitle class="text-2xl">{{ stat.value }}</h3>
            </div>
          </section>
        }
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Signups</h3>
            <p hlmCardDescription>New accounts per month. Single series, so no legend.</p>
          </div>
          <div hlmCardContent>
            <lib-bar-chart
              [data]="signups()"
              [series]="signupSeries"
              [xFormatter]="months"
              [yFormatter]="compact"
            />
          </div>
        </section>

        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Storage used</h3>
            <p hlmCardDescription>Share of the storage quota by bucket.</p>
          </div>
          <div hlmCardContent>
            <lib-donut-chart [segments]="storage" />
          </div>
        </section>
      </div>
    </div>
  `,
})
export class Overview {
  protected readonly stats = [
    { label: 'Active users', value: '1,248' },
    { label: 'Open tickets', value: '17' },
    { label: 'Failed jobs (24h)', value: '3' },
  ];

  protected readonly signups = signal<SignupRow[]>([
    { month: 'Jan', signups: 96 },
    { month: 'Feb', signups: 132 },
    { month: 'Mar', signups: 118 },
    { month: 'Apr', signups: 164 },
    { month: 'May', signups: 149 },
    { month: 'Jun', signups: 187 },
  ]);

  protected readonly signupSeries: ChartSeries[] = [{ key: 'signups', label: 'Signups' }];

  protected readonly storage: ChartSegment[] = [
    { label: 'Uploads', value: 62 },
    { label: 'Backups', value: 28 },
    { label: 'Logs', value: 10 },
  ];

  protected readonly months = labelFormatter(this.signups, 'month');
  protected readonly compact = compactFormatter();
}
