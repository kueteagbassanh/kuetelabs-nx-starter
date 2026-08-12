import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DonutChartComponent, DonutType } from 'angular-chrts';
import { injectIsBrowser } from './chart-browser';
import { chartSegments, type ChartSegment } from './chart-palette';

@Component({
  selector: 'lib-donut-chart',
  imports: [DonutChartComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-slot': 'chart', class: 'block w-full' },
  template: `
    @if (isBrowser) {
      <ngx-donut-chart
        [data]="values()"
        [categories]="categories()"
        [height]="height()"
        [type]="type()"
        [arcWidth]="arcWidth()"
        [padAngle]="padAngle()"
        [hideLegend]="hideLegend()"
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
export class DonutChart {
  protected readonly isBrowser = injectIsBrowser();

  readonly segments = input.required<readonly ChartSegment[]>();
  readonly height = input(250);
  readonly type = input<DonutType>(DonutType.Full);
  readonly arcWidth = input(40);
  /** Small gap between arcs so adjacent fills stay separable. */
  readonly padAngle = input(0.02);
  readonly hideLegend = input(false);

  private readonly resolved = computed(() => chartSegments(this.segments()));
  protected readonly values = computed(() => this.resolved().data);
  protected readonly categories = computed(() => this.resolved().categories);
}
