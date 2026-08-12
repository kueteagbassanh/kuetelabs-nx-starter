import { AreaChart } from './lib/area-chart';
import { BarChart } from './lib/bar-chart';
import { DonutChart } from './lib/donut-chart';
import { LineChart } from './lib/line-chart';

export * from './lib/area-chart';
export * from './lib/bar-chart';
export * from './lib/chart-formatters';
export * from './lib/chart-palette';
export * from './lib/donut-chart';
export * from './lib/line-chart';

/** Convenience import for templates using several chart types. */
export const ChartsImports = [AreaChart, LineChart, BarChart, DonutChart] as const;
