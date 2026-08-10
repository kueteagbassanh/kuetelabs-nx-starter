import { isDevMode } from '@angular/core';
import type { BulletLegendItemInterface } from '@unovis/ts';

/** Number of categorical slots the theme defines as `--chart-1` … `--chart-5`. */
export const CHART_SLOT_COUNT = 5;

export type ChartSlot = 1 | 2 | 3 | 4 | 5;

/** One plotted series, mapped to a key on each data row. */
export interface ChartSeries {
  /** Property on each data row holding this series' value. */
  key: string;
  /** Legend and tooltip label. Defaults to `key`. */
  label?: string;
  /** Palette slot override. Defaults to declaration order, 1-based. */
  slot?: ChartSlot;
}

/** One segment of a donut chart. */
export interface ChartSegment {
  label: string;
  value: number;
  slot?: ChartSlot;
}

/** Reference to a theme palette slot — resolved by CSS, so it follows dark mode. */
export function chartColor(slot: number): string {
  return `var(--chart-${slot})`;
}

function slotFor(index: number, override?: ChartSlot): number {
  if (override) {
    return override;
  }
  // Slots are assigned in declaration order and never cycled: color must follow the
  // entity, not its rank, so filtering a series out never repaints the survivors.
  return (index % CHART_SLOT_COUNT) + 1;
}

function warnOnOverflow(count: number): void {
  if (isDevMode() && count > CHART_SLOT_COUNT) {
    console.warn(
      `[charts] ${count} series exceeds the ${CHART_SLOT_COUNT} palette slots, so colors repeat ` +
        `and become ambiguous. Fold the tail into an "Other" series, facet into small multiples, ` +
        `or add a slot to --chart-N in styles.css (and re-run the palette validator).`,
    );
  }
}

/** Maps series onto the Unovis `categories` record, coloring each from the theme palette. */
export function chartCategories(
  series: readonly ChartSeries[],
): Record<string, BulletLegendItemInterface> {
  warnOnOverflow(series.length);

  return series.reduce<Record<string, BulletLegendItemInterface>>((categories, item, index) => {
    categories[item.key] = {
      name: item.label ?? item.key,
      color: chartColor(slotFor(index, item.slot)),
    };
    return categories;
  }, {});
}

/** Splits donut segments into the parallel `data` / `categories` inputs Unovis expects. */
export function chartSegments(segments: readonly ChartSegment[]): {
  data: number[];
  categories: Record<string, BulletLegendItemInterface>;
} {
  warnOnOverflow(segments.length);

  const categories: Record<string, BulletLegendItemInterface> = {};
  segments.forEach((segment, index) => {
    categories[segment.label] = {
      name: segment.label,
      color: chartColor(slotFor(index, segment.slot)),
    };
  });

  return { data: segments.map((segment) => segment.value), categories };
}
