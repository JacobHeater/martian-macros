import { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import type { LoggingStreak } from './LoggingStreak';
import { pauseOn } from './pauseOn';
import { StreakRule } from './StreakRule';

/**
 * The logging streak counted back from `startEpochDay` over `wholeDays`
 * (MM-92), by the one rule: one missed day in any
 * `StreakRule.forgiveWithinDays` is forgiven and a second breaks it; a
 * paused day (MM-148) neither counts nor breaks it. `startEpochDay` is a
 * day like any other: the caller decides whether today may be a miss.
 */
export function streakEndingOn({
  wholeDays,
  startEpochDay,
  pauses = [],
}: {
  wholeDays: ReadonlySet<number>;
  startEpochDay: number;
  pauses?: readonly Pause[];
}): LoggingStreak {
  if (wholeDays.size === 0) return { days: 0 };
  const first = Math.min(...wholeDays);
  let days = 0;
  let lastMiss: number | undefined;
  let forgiven: number | undefined;
  for (let day = startEpochDay; day >= first; day--) {
    if (pauseOn(pauses, CalendarDate.fromEpochDay(day)) !== undefined) continue;
    if (wholeDays.has(day)) {
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
