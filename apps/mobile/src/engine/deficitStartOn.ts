import type { CalendarDate } from '../domain/CalendarDate';
import type { TargetsRecord } from './TargetsRecord';

/**
 * The first day of the unbroken run of deficit targets in force as of
 * `today`, or none: the earliest of the trailing records planned below
 * maintenance, moved up to `restartOn` when a gap or a pause restarted the
 * count after it (MM-147, MM-148). `consecutiveDeficitWeeks` counts from it.
 */
export function deficitStartOn(
  history: readonly TargetsRecord[],
  today: CalendarDate,
  { restartOn }: { restartOn?: CalendarDate | undefined } = {},
): CalendarDate | undefined {
  let start: CalendarDate | undefined;
  for (let i = history.length - 1; i >= 0; i--) {
    const record = history[i] as TargetsRecord;
    if (record.effectiveFrom.isAfter(today)) continue;
    if (record.targets.weeklyRateFraction >= 0) break;
    start = record.effectiveFrom;
  }
  if (start === undefined) return undefined;
  if (restartOn !== undefined && restartOn.isAfter(start) && !restartOn.isAfter(today)) start = restartOn;
  return start;
}
