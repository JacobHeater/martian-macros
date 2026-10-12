import { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import type { Pause } from '../domain/Pause';
import type { LoggingStreak } from './LoggingStreak';
import { pauseOn } from './pauseOn';
import { StreakRule } from './StreakRule';
import { usableIntakeDays } from './usableIntakeDays';

/**
 * The logging streak as of `today` (MM-92).
 *
 * A day counts when it is a whole day by the same rule the adherence summary
 * and the expenditure estimate use (`usableIntakeDays`), so the app never
 * rewards what it does not count elsewhere. Nothing about how much was
 * eaten, or whether it was under target, matters: a whole day is a whole
 * day.
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
}: {
  today: CalendarDate;
  intake: readonly IntakeDay[];
  pauses?: Iterable<Pause>;
}): LoggingStreak {
  const whole = new Set(
    usableIntakeDays(intake.filter((d) => d.kcal > 0 && !d.date.isAfter(today))).map((d) => d.date.epochDay),
  );
  if (whole.size === 0) return { days: 0 };
  const first = Math.min(...whole);
  const all = [...pauses];
  let days = 0;
  let lastMiss: number | undefined;
  let forgiven: number | undefined;
  const start = whole.has(today.epochDay) ? today.epochDay : today.epochDay - 1;
  for (let day = start; day >= first; day--) {
    if (pauseOn(all, CalendarDate.fromEpochDay(day)) !== undefined) continue;
    if (whole.has(day)) {
      days++;
      continue;
    }
    if (lastMiss !== undefined && lastMiss - day < StreakRule.forgiveWithinDays) {
      break;
    }
    lastMiss = day;
    forgiven ??= day;
  }
  return {
    days,
    forgivenOn: forgiven === undefined ? undefined : CalendarDate.fromEpochDay(forgiven),
  };
}
