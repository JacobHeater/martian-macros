import type { CalendarDate } from '../../../domain/CalendarDate';
import type { TargetsRecord } from '../../TargetsRecord';

/** The targets in force on a day, from `history` in any order: the latest whose `effectiveFrom` is on or before it. */
export function recordOnOf(history: readonly TargetsRecord[]): (date: CalendarDate) => TargetsRecord | undefined {
  const sorted = [...history].sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom));
  return (date) => {
    let found: TargetsRecord | undefined;
    for (const r of sorted) {
      if (r.effectiveFrom.isAfter(date)) break;
      found = r;
    }
    return found;
  };
}
