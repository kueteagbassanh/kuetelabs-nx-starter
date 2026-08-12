import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { AreaChartComponent, type axisFormatter } from 'angular-chrts';
import type { CurveType } from '@unovis/ts';
import { injectIsBrowser } from './chart-browser';
import { chartCategories, type ChartSeries } from './chart-palette';

@Component({
  selector: 'lib-area-chart',
  imports: [AreaChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'chart', class: 'block w-full' },
  template: `
    @if (isBrowser) {
      <ngx-area-chart
        [data]="data()"
        [categories]="categories()"
        [height]="height()"
        [stacked]="stacked()"
        [yGridLine]="yGridLine()"
        [xFormatter]="xFormatter()"
        [xNumTicks]="tickCount()"
        [yFormatter]="yFormatter()"
        [curveType]="curveType()"
        [hideLegend]="legendHidden()"
      />
    } @else {
      <div
        class="bg-muted animate-pulse rounded-md"
        [style.height.px]="height()"
        aria-hidden="true"
      ></div>
    }
  `,
})
export class AreaChart<T extends Record<string, unknown>> {
  protected readonly isBrowser = injectIsBrowser();

  readonly data = input.required<T[]>();
  readonly series = input.required<readonly ChartSeries[]>();
  readonly height = input(250);
  readonly stacked = input(false);
  readonly yGridLine = input(true);
  readonly xFormatter = input<axisFormatter | undefined>(undefined);
  readonly yFormatter = input<axisFormatter | undefined>(undefined);
  /** Ticks on the x-axis. Small datasets label every row; larger ones let d3 thin them. */
  readonly xNumTicks = input<number | undefined>(undefined);
  readonly curveType = input<CurveType | undefined>(undefined);
  /** Defaults to hiding the legend for a single series — the title already names it. */
  readonly hideLegend = input<boolean | undefined>(undefined);

  protected readonly categories = computed(() => chartCategories(this.series()));
  protected readonly tickCount = computed(
    () => this.xNumTicks() ?? (this.data().length <= 8 ? this.data().length : undefined),
  );
  protected readonly legendHidden = computed(() => this.hideLegend() ?? this.series().length < 2);
}
