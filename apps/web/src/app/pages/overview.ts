import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { HlmCardImports } from '@kuetelabs/frontend/ui/components/card';
import {
  AreaChart,
  BarChart,
  DonutChart,
  LineChart,
  type ChartSegment,
  type ChartSeries,
  compactFormatter,
  currencyFormatter,
  labelFormatter,
} from '@kuetelabs/frontend/ui/charts';

interface TrafficRow extends Record<string, unknown> {
  month: string;
  desktop: number;
  mobile: number;
}

interface RevenueRow extends Record<string, unknown> {
  quarter: string;
  subscriptions: number;
  services: number;
}

/**
 * Demo dashboard page — the reference for wiring charts into the dashboard layout.
 * Replace or delete when starting a real project; the charts lib is the reusable part.
 */
@Component({
  selector: 'app-overview',
  imports: [...HlmCardImports, AreaChart, LineChart, BarChart, DonutChart],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-4 p-4">
      <div class="grid gap-4 md:grid-cols-2">
        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle class="leading-none font-semibold">Sessions</h3>
            <p hlmCardDescription>
              Desktop and mobile sessions, stacked, last six months.
            </p>
          </div>
          <div hlmCardContent>
            <lib-area-chart
              [data]="traffic()"
              [series]="trafficSeries"
              [stacked]="true"
              [xFormatter]="trafficMonths"
              [yFormatter]="compact"
            />
          </div>
        </section>

        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Session trend</h3>
            <p hlmCardDescription>
              The same series unstacked, to compare shape over time.
            </p>
          </div>
          <div hlmCardContent>
            <lib-line-chart
              [data]="traffic()"
              [series]="trafficSeries"
              [xFormatter]="trafficMonths"
              [yFormatter]="compact"
            />
          </div>
        </section>

        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Revenue by quarter</h3>
            <p hlmCardDescription>Subscriptions versus services, grouped.</p>
          </div>
          <div hlmCardContent>
            <lib-bar-chart
              [data]="revenue()"
              [series]="revenueSeries"
              [xFormatter]="revenueQuarters"
              [yFormatter]="currency"
            />
          </div>
        </section>

        <section hlmCard>
          <div hlmCardHeader>
            <h3 hlmCardTitle>Plan mix</h3>
            <p hlmCardDescription>Share of active subscriptions by plan.</p>
          </div>
          <div hlmCardContent>
            <lib-donut-chart [segments]="plans" />
          </div>
        </section>
      </div>
    </div>
  `,
})
export class Overview {
  protected readonly traffic = signal<TrafficRow[]>([
    { month: 'Jan', desktop: 186, mobile: 80 },
    { month: 'Feb', desktop: 305, mobile: 200 },
    { month: 'Mar', desktop: 237, mobile: 120 },
    { month: 'Apr', desktop: 273, mobile: 190 },
    { month: 'May', desktop: 209, mobile: 130 },
    { month: 'Jun', desktop: 264, mobile: 175 },
  ]);

  protected readonly revenue = signal<RevenueRow[]>([
    { quarter: 'Q1', subscriptions: 42000, services: 18000 },
    { quarter: 'Q2', subscriptions: 51000, services: 21000 },
    { quarter: 'Q3', subscriptions: 47000, services: 26000 },
    { quarter: 'Q4', subscriptions: 63000, services: 24000 },
  ]);

  // Series declare their own labels; colors come from the theme palette in order.
  protected readonly trafficSeries: ChartSeries[] = [
    { key: 'desktop', label: 'Desktop' },
    { key: 'mobile', label: 'Mobile' },
  ];

  protected readonly revenueSeries: ChartSeries[] = [
    { key: 'subscriptions', label: 'Subscriptions' },
    { key: 'services', label: 'Services' },
  ];

  protected readonly plans: ChartSegment[] = [
    { label: 'Starter', value: 480 },
    { label: 'Pro', value: 310 },
    { label: 'Enterprise', value: 120 },
  ];

  protected readonly trafficMonths = labelFormatter(this.traffic, 'month');
  protected readonly revenueQuarters = labelFormatter(this.revenue, 'quarter');
  protected readonly compact = compactFormatter();
  protected readonly currency = currencyFormatter();
}
