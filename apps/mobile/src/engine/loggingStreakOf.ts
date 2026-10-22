import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import type { Pause } from '../domain/Pause';
import type { LoggingStreak } from './LoggingStreak';
import { streakEndingOn } from './streakEndingOn';
import { usableIntakeDays } from './usableIntakeDays';

/**
 * The logging streak as of `today` (MM-92).
 *
 * A day counts when it is a whole day by the same rule the adherence summary
 * and the expenditure estimate use (`usableIntakeDays`), so the app never
 * rewards what it does not count elsewhere. Nothing about how much was
 * eaten, or whether it was under target, matters: a whole day is a whole
 * day. A shaped week's planned lower day (MM-124) is read against its plan
 * (`plannedShare`), so eating it as planned never breaks the streak.
 *
 * - One missed day in any `StreakRule.forgiveWithinDays` is forgiven; a
 *   second breaks the streak.
 * - A paused day (MM-148) neither counts nor breaks it.
 * - Today is not over: it counts when it is already whole and is never a
 *   miss.
 */
export function loggingStreakOf({
  today,
  intake,
  pauses = [],
  plannedShare,
}: {
  today: CalendarDate;
  intake: readonly IntakeDay[];
  pauses?: Iterable<Pause>;
  /** The share of the flat figure planned for each day (MM-124); every day flat without it. */
  plannedShare?: ((date: CalendarDate) => number) | undefined;
}): LoggingStreak {
  const logged = intake.filter((d) => d.kcal > 0 && !d.date.isAfter(today));
  const wholeDays = new Set(usableIntakeDays(logged, { plannedShare }).map((d) => d.date.epochDay));
  const startEpochDay = wholeDays.has(today.epochDay) ? today.epochDay : today.epochDay - 1;
  return streakEndingOn({ wholeDays, startEpochDay, pauses: [...pauses] });
}
