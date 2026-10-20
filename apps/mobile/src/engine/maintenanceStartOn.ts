import type { CalendarDate } from '../domain/CalendarDate';
import type { TargetsRecord } from './TargetsRecord';

/**
 * The day the current run of maintenance began (MM-130): the first of the
 * trailing records in maintenance mode, as of `today`. Undefined when the
 * current targets are not maintenance. A break inside a cut (a diet break,
 * a requested week) keeps its fat-loss mode, so it does not count.
 */
export function maintenanceStartOn(history: readonly TargetsRecord[], today: CalendarDate): CalendarDate | undefined {
  const inForce = history.filter((r) => !r.effectiveFrom.isAfter(today));
  let start: CalendarDate | undefined;
  for (let i = inForce.length - 1; i >= 0; i--) {
    const record = inForce[i] as TargetsRecord;
    if (record.mode !== 'maintenance') break;
    start = record.effectiveFrom;
  }
  return start;
}
