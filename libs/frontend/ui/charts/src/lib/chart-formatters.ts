/**
 * Axis tick formatters. Unovis hands x-axis ticks the row *index*, not the row, so
 * reading a label off the data is the single most common formatter in practice.
 */

/** Formats x-axis ticks as `rows[tick][key]` — e.g. the month name behind index 3. */
export function labelFormatter<T>(rows: () => readonly T[], key: keyof T) {
  return (tick: number | Date): string => {
    const row = rows()[Number(tick)];
    return row == null ? '' : String(row[key] ?? '');
  };
}

/** Compact number formatting for y-axis ticks: 12400 → "12.4K". */
export function compactFormatter(locale?: string) {
  const format = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
  return (tick: number | Date): string => format.format(Number(tick));
}

/** Currency formatting for y-axis ticks or tooltips. */
export function currencyFormatter(currency = 'USD', locale?: string) {
  const format = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  return (tick: number | Date): string => format.format(Number(tick));
}
