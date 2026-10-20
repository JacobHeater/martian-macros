import type { CalendarDate } from '../domain/CalendarDate';
import type { MenstruationDay } from '../domain/MenstruationDay';
import { CycleRule } from './CycleRule';
import { cycleWindows } from './cycleWindows';

/**
 * Returns a weight-noise multiplier per date that widens measurement noise
 * from `daysBefore` days before each menses start through `daysAfter` days
 * after, when water retention is highest.
 *
 * A menses start is a flow day whose previous day had no flow.
 */
export function cycleNoiseMultiplier(
  flowDays: Iterable<MenstruationDay>,
  {
    daysBefore = CycleRule.daysBefore,
    daysAfter = CycleRule.daysAfter,
    multiplier = CycleRule.multiplier,
  }: { daysBefore?: number; daysAfter?: number; multiplier?: number } = {},
): (date: CalendarDate) => number {
  const windows = cycleWindows(flowDays, { daysBefore, daysAfter });
  if (windows.length === 0) return () => 1;
  const widened = new Set<number>();
  for (const { from, to } of windows) {
    for (let d = from.epochDay; d <= to.epochDay; d++) widened.add(d);
  }
  return (date) => (widened.has(date.epochDay) ? multiplier : 1);
}
