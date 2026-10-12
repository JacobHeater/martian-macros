import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import { PauseRule } from './PauseRule';

/**
 * The day the unbroken-deficit count restarts because of a pause, or
 * undefined (MM-148). A pause of `PauseRule.deficitBreakDays` days or more
 * is a diet break: the count restarts on the first day after it, or today
 * while it is still running and that many days of it have passed.
 */
export function pauseDeficitRestartOn(pauses: Iterable<Pause>, today: CalendarDate): CalendarDate | undefined {
  let latest: CalendarDate | undefined;
  for (const pause of pauses) {
    if (pause.from.isAfter(today)) continue;
    const ended = pause.to.isBefore(today);
    const elapsed = ended ? pause.days : pause.from.daysUntil(today) + 1;
    if (elapsed < PauseRule.deficitBreakDays) continue;
    const restart = ended ? pause.resumesOn : today;
    if (latest === undefined || restart.isAfter(latest)) latest = restart;
  }
  return latest;
}
