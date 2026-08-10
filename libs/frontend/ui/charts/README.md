# charts

Themed chart components for the workspace. Wraps [`angular-chrts`](https://angularcharts.com/docs)
(Unovis) so feature code never imports the chart library directly — that keeps the SSR guard,
the palette rules, and the legend defaults in one place, and makes swapping the underlying
library a change to this lib alone.

```ts
import { AreaChart, labelFormatter, type ChartSeries } from '@kuetelabs/frontend/ui/charts';

@Component({
  imports: [AreaChart],
  template: `
    <lib-area-chart [data]="rows()" [series]="series" [stacked]="true" [xFormatter]="months" />
  `,
})
export class Sessions {
  protected readonly rows = signal([{ month: 'Jan', desktop: 186, mobile: 80 }]);
  protected readonly series: ChartSeries[] = [
    { key: 'desktop', label: 'Desktop' },
    { key: 'mobile', label: 'Mobile' },
  ];
  protected readonly months = labelFormatter(this.rows, 'month');
}
```

## Components

| Selector | Notes |
| --- | --- |
| `lib-area-chart` | `stacked`, `curveType`, `yGridLine` |
| `lib-line-chart` | `lineWidth` defaults to 2px |
| `lib-bar-chart` | derives Unovis' `yAxis` from `series`; 4px rounded ends; `orientation` |
| `lib-donut-chart` | takes `segments` (`{ label, value }`) instead of parallel arrays |

## What the wrappers decide for you

- **Colors come from the theme, in order.** Declare `series` (or `segments`) with a `key` and
  `label`; slot *n* gets `var(--chart-n)`. Never pass a hex — a hardcoded color breaks dark mode
  and the palette's CVD guarantees. Override a specific series with `slot: 3` when a color must
  stay pinned to an entity across charts.
- **More than 5 series warns in dev.** The theme defines 5 slots; past that, colors repeat and
  become ambiguous. Fold the tail into "Other" or facet into small multiples.
- **The legend is automatic**: shown for 2+ series, hidden for one (the card title already names
  it). Override with `[hideLegend]`.
- **SSR is handled.** Unovis needs the DOM, so each component renders a same-height placeholder
  on the server and the chart after hydration. No `isPlatformBrowser` in feature code.

## Formatters

Unovis passes the x-axis tick *index*, not the row — `labelFormatter(rows, 'month')` covers the
common case. `compactFormatter()` (12400 → "12.4K") and `currencyFormatter('EUR')` are provided
for value axes.

## Related

- Palette, Unovis `--vis-*` bridge, and the upstream gotchas: `docs/ARCHITECTURE.md` §7a
- Tokens: `--chart-1..5` in `libs/frontend/ui/theme/src/tokens.css`
