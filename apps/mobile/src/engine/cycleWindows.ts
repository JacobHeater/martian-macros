import type { CalendarDate } from '../domain/CalendarDate';
import type { MenstruationDay } from '../domain/MenstruationDay';
import { CycleRule } from './CycleRule';

/**
 * The windows around each menses start in which the scale carries extra
 * water (MM-19, MM-20): from `daysBefore` before the start through
 * `daysAfter` after it. A start is a flow day whose previous day had no
 * flow. The trend widens its noise here, and the chart marks it.
 */
export function cycleWindows(
  flowDays: Iterable<MenstruationDay>,
  { daysBefore = CycleRule.daysBefore, daysAfter = CycleRule.daysAfter }: { daysBefore?: number; daysAfter?: number } = {},
): { from: CalendarDate; to: CalendarDate }[] {
  const flow = new Map<number, CalendarDate>();
  for (const d of flowDays) flow.set(d.date.epochDay, d.date);
  return [...flow.values()]
    .filter((date) => !flow.has(date.epochDay - 1))
    .sort((a, b) => a.compareTo(b))
    .map((start) => ({ from: start.addDays(-daysBefore), to: start.addDays(daysAfter) }));
}
