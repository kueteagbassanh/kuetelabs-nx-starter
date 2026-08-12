# theme

The workspace design system as CSS: Tailwind v4 layers, the spartan preset, design tokens for
light and dark, the chart palette and Unovis bridge, and the base layer. Every app imports this,
so `web`, `admin`, and anything added later render the same system.

## Use it

An app's own entry stylesheet stays as the place for app-specific styles, and starts with:

```css
@import '../../../libs/frontend/ui/theme/src/index.css';
```

Register that entry stylesheet in the app's `project.json` under `build.options.styles`, and add
`"implicitDependencies": ["theme"]` so `nx affected` rebuilds the app when the theme changes —
Nx's graph does not follow CSS `@import`, so without it a token change looks like it affects
nothing.

## Files

| File | Contents |
| --- | --- |
| `index.css` | Entry point; import order is significant (Tailwind + preset, then tokens, then consumers) |
| `tokens.css` | `:root` / `:root.dark` design tokens, including `--chart-1..5` |
| `charts.css` | `@theme inline` chart utilities and the Unovis `--vis-*` bridge |
| `base.css` | `@layer base` defaults |

## Re-theming

Change values in `tokens.css` only. Components consume `bg-primary`, `text-muted-foreground`,
`var(--chart-1)` and never hardcode color, so one file re-skins every app. Chart palette changes
must be re-validated — see `docs/ARCHITECTURE.md` §7a.
