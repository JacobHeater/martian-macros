import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';

/** How many days from `from` to `to`, both included, are paused (MM-148). */
export function pausedDaysBetween(pauses: Iterable<Pause>, from: CalendarDate, to: CalendarDate): number {
  const days = new Set<number>();
  for (const pause of pauses) {
    const start = pause.from.isBefore(from) ? from : pause.from;
    const end = pause.to.isAfter(to) ? to : pause.to;
    for (let d = start.epochDay; d <= end.epochDay; d++) {
      days.add(d);
    }
  }
  return days.size;
}
