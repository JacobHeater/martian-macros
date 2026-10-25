import type { TrendDay } from './TrendDay';
import type { TrendPoint } from './TrendPoint';
import { TrendRule } from './TrendRule';

/**
 * The run of days that each `qualifies`, ending on the last day of `days`
 * (yesterday) or the day before (MM-605, D4). One ineligible day may sit
 * inside it; a second, or an eligible day that does not qualify, ends it.
 * `days` is one entry per calendar day, ascending. Undefined when no run
 * ends there.
 */
export function runEndingNear(
  days: readonly TrendDay[],
  qualifies: (point: TrendPoint) => boolean,
): { readonly points: readonly TrendPoint[]; readonly start: TrendDay } | undefined {
  const counts = (day: TrendDay | undefined): day is TrendPoint =>
    day !== undefined && day.eligible && day.value !== undefined && qualifies(day as TrendPoint);
  const last = days.length - 1;
  const end = counts(days[last]) ? last : counts(days[last - 1]) ? last - 1 : undefined;
  if (end === undefined) return undefined;
  const points: TrendPoint[] = [];
  let start = end;
  let gaps = 0;
  for (let i = end; i >= 0; i--) {
    const day = days[i] as TrendDay;
    if (!day.eligible || day.value === undefined) {
      gaps += 1;
      if (gaps > TrendRule.run.gapsAllowed) break;
      continue;
    }
    if (!counts(day)) break;
    points.push(day);
    start = i;
  }
  return { points: points.reverse(), start: days[start] as TrendDay };
}
