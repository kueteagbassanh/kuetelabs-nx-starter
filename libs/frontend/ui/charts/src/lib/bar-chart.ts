import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BarChartComponent } from 'angular-chrts';
import { Orientation } from '@unovis/ts';
import { injectIsBrowser } from './chart-browser';
import { chartCategories, type ChartSeries } from './chart-palette';

type BarFormatter = (tick: number | Date, i?: number, ticks?: (number | Date)[]) => string;

@Component({
  selector: 'lib-bar-chart',
  imports: [BarChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'chart', class: 'block w-full' },
  template: `
    @if (isBrowser) {
      <ngx-bar-chart
        [data]="data()"
        [categories]="categories()"
        [yAxis]="plottedKeys()"
        [height]="height()"
        [stacked]="stacked()"
        [radius]="radius()"
        [yGridLine]="yGridLine()"
        [xFormatter]="xFormatter()"
        [xNumTicks]="tickCount()"
        [yFormatter]="yFormatter()"
        [orientation]="orientation()"
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
export class BarChart<T extends Record<string, unknown>> {
  protected readonly isBrowser = injectIsBrowser();

  readonly data = input.required<T[]>();
  readonly series = input.required<readonly ChartSeries[]>();
  readonly height = input(250);
  readonly stacked = input(false);
  /** 4px rounded data-ends, anchored to the baseline. */
  readonly radius = input(4);
  readonly yGridLine = input(true);
  readonly xFormatter = input<BarFormatter | undefined>(undefined);
  readonly yFormatter = input<BarFormatter | undefined>(undefined);
  /** Vertical bars by default; switch to horizontal for long category labels. */
  /** Ticks on the x-axis. Small datasets label every row; larger ones let d3 thin them. */
  readonly xNumTicks = input<number | undefined>(undefined);
  readonly orientation = input<Orientation>(Orientation.Vertical);
  readonly hideLegend = input<boolean | undefined>(undefined);

  protected readonly categories = computed(() => chartCategories(this.series()));
  /** Unovis needs the plotted keys separately; derive them so callers declare series once. */
  protected readonly plottedKeys = computed(() => this.series().map((item) => item.key as keyof T));
  protected readonly tickCount = computed(
    () => this.xNumTicks() ?? (this.data().length <= 8 ? this.data().length : undefined),
  );
  protected readonly legendHidden = computed(() => this.hideLegend() ?? this.series().length < 2);
}
