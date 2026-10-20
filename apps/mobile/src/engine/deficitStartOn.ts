import type { CalendarDate } from '../domain/CalendarDate';
import { DietBreakRule } from './DietBreakRule';
import type { TargetsRecord } from './TargetsRecord';

/**
 * The first day of the unbroken run of deficit targets in force as of
 * `today`, or none: the earliest of the trailing records planned below
 * maintenance, moved up to `restartOn` when a gap or a pause restarted the
 * count after it (MM-147, MM-148). `consecutiveDeficitWeeks` counts from it.
 *
 * Targets at or above maintenance end the run only when they were in force
 * for `DietBreakRule.resetDays` consecutive days (MM-135): a break, a
 * maintenance week or a change of goal and back. A shorter stretch, a goal
 * changed and changed back inside a week, say, leaves the run whole.
 * Targets in force today that are at or above maintenance mean there is no
 * run, whatever their age.
 */
export function deficitStartOn(
  history: readonly TargetsRecord[],
  today: CalendarDate,
  { restartOn }: { restartOn?: CalendarDate | undefined } = {},
): CalendarDate | undefined {
  const inForce = history.filter((record) => !record.effectiveFrom.isAfter(today));
  let start: CalendarDate | undefined;
  for (let i = inForce.length - 1; i >= 0; i--) {
    const record = inForce[i] as TargetsRecord;
    if (record.targets.weeklyRateFraction >= 0) {
      const next = inForce[i + 1];
      // The current targets: no run. Earlier ones: a stretch at or above
      // maintenance, measured to the record that followed it.
      if (next === undefined) return undefined;
      if (record.effectiveFrom.daysUntil(next.effectiveFrom) >= DietBreakRule.resetDays) break;
      continue;
    }
    start = record.effectiveFrom;
  }
  if (start === undefined) return undefined;
  if (restartOn !== undefined && restartOn.isAfter(start) && !restartOn.isAfter(today)) start = restartOn;
  return start;
}
