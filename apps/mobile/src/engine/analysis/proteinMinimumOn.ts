import type { CalendarDate } from '../../domain/CalendarDate';
import type { TargetsRecord } from '../TargetsRecord';

/** The protein minimum in force on `date` (MM-121), or undefined before any targets. */
export function proteinMinimumOn(history: readonly TargetsRecord[], date: CalendarDate): number | undefined {
  let found: TargetsRecord | undefined;
  for (const record of history) {
    if (record.effectiveFrom.isAfter(date)) continue;
    if (found === undefined || !record.effectiveFrom.isBefore(found.effectiveFrom)) found = record;
  }
  return found?.targets.proteinMinimumG;
}
