import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';

/** The pause that covers `date`, or undefined (MM-148). */
export function pauseOn(pauses: Iterable<Pause>, date: CalendarDate): Pause | undefined {
  for (const pause of pauses) {
    if (pause.covers(date)) return pause;
  }
  return undefined;
}
