import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import { streakEndingOn } from './streakEndingOn';

/**
 * The longest logging streak inside `from`..`to` (MM-92, for the monthly
 * report, MM-33), by the Dashboard streak's own rule. `wholeDays` are the
 * period's whole days, already chosen by `usableIntakeDays`; a run does not
 * reach back past the first of them. It counts the work only: how much was
 * eaten plays no part.
 */
export function longestLoggingRunOf({
  from,
  to,
  wholeDays,
  pauses = [],
}: {
  from: CalendarDate;
  to: CalendarDate;
  wholeDays: Iterable<CalendarDate>;
  pauses?: Iterable<Pause>;
}): number {
  const days = new Set([...wholeDays].filter((d) => !d.isBefore(from) && !d.isAfter(to)).map((d) => d.epochDay));
  const paused = [...pauses];
  let longest = 0;
  for (let day = from.epochDay; day <= to.epochDay; day++) {
    if (!days.has(day)) continue;
    longest = Math.max(longest, streakEndingOn({ wholeDays: days, startEpochDay: day, pauses: paused }).days);
  }
  return longest;
}
