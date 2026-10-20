import type { CalendarDate } from '../domain/CalendarDate';
import type { Workout } from '../domain/training/Workout';

/**
 * The day training started, or started again (MM-140): the latest finished
 * workout up to `asOf` with no finished workout in the `gapDays` before it.
 * Undefined with no finished workout. A workout in progress is not yet a
 * day trained.
 */
export function trainingStartOn(
  workouts: readonly Workout[],
  { asOf, gapDays }: { asOf: CalendarDate; gapDays: number },
): CalendarDate | undefined {
  const days = [...new Set(workouts.filter((w) => w.endedAt !== undefined && !w.date.isAfter(asOf)).map((w) => w.date))].sort(
    (a, b) => a.compareTo(b),
  );
  let start: CalendarDate | undefined;
  let previous: CalendarDate | undefined;
  for (const day of days) {
    if (previous === undefined || previous.daysUntil(day) > gapDays) start = day;
    previous = day;
  }
  return start;
}
