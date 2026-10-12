import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';

/** The pause that ended most recently before `today`, or undefined (MM-148). */
export function latestEndedPause(pauses: Iterable<Pause>, today: CalendarDate): Pause | undefined {
  let latest: Pause | undefined;
  for (const pause of pauses) {
    if (!pause.to.isBefore(today)) continue;
    if (latest === undefined || pause.to.isAfter(latest.to)) latest = pause;
  }
  return latest;
}
