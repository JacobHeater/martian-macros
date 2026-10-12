import type { CalendarDate } from '../domain/CalendarDate';
import type { MenstruationDay } from '../domain/MenstruationDay';

/**
 * Returns a weight-noise multiplier per date that widens measurement noise
 * from `daysBefore` days before each menses start through `daysAfter` days
 * after, when water retention is highest.
 *
 * A menses start is a flow day whose previous day had no flow.
 */
export function cycleNoiseMultiplier(
  flowDays: Iterable<MenstruationDay>,
  { daysBefore = 5, daysAfter = 2, multiplier = 1.6 }: { daysBefore?: number; daysAfter?: number; multiplier?: number } = {},
): (date: CalendarDate) => number {
  const flow = new Set<number>();
  for (const d of flowDays) flow.add(d.date.epochDay);
  const starts = [...flow].filter((day) => !flow.has(day - 1));
  if (starts.length === 0) return () => 1;
  const widened = new Set<number>();
  for (const start of starts) {
    for (let d = start - daysBefore; d <= start + daysAfter; d++) widened.add(d);
  }
  return (date) => (widened.has(date.epochDay) ? multiplier : 1);
}
