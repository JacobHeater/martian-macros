import type { CalendarDate } from '../domain/CalendarDate';
import type { TargetsRecord } from '../engine/TargetsRecord';

/** The targets that were in force on `day`. */
export function targetsOn(
  history: readonly TargetsRecord[],
  day: CalendarDate,
  { targetsAllowed = true }: { targetsAllowed?: boolean } = {},
): TargetsRecord | undefined {
  if (!targetsAllowed) return undefined;
  let found: TargetsRecord | undefined;
  for (const record of history) {
    if (record.effectiveFrom.isAfter(day)) break;
    found = record;
  }
  return found ?? history[0];
}
