import type { CalendarDate } from '../../../src/domain';
import type { TrendDay } from '../../../src/engine';

/**
 * A daily series for the trend engine (MM-605): one day per value from
 * `start`, eligible where the value is a number and unlogged where it is
 * undefined. `extra` adds a target or anything else to a day.
 */
export function trendDays(
  start: CalendarDate,
  values: readonly (number | undefined)[],
  extra: (index: number, date: CalendarDate) => Partial<TrendDay> = () => ({}),
): TrendDay[] {
  return values.map((value, index) => {
    const date = start.addDays(index);
    const day: TrendDay =
      value === undefined
        ? { date, value: undefined, eligible: false, reason: 'unlogged' }
        : { date, value, eligible: true, reason: undefined };
    return { ...day, ...extra(index, date) };
  });
}
