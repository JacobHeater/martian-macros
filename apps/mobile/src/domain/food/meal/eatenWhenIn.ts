import { CalendarDate } from '../../CalendarDate';
import { minuteOfDayIn } from './minuteOfDayIn';

/**
 * When a meal was eaten, as an answer writes it (MM-594): the day and the
 * minute of it from "2026-10-22T18:30" (or with a space), or only the minute
 * from a time alone. What cannot be read is left out, never guessed.
 */
export function eatenWhenIn(text: string): { eatenOn?: CalendarDate | undefined; eatenAt?: number | undefined } {
  const both = /^\s*(\d{4}-\d{2}-\d{2})(?:[T\s]+(.+))?$/.exec(text);
  if (both === null) return { eatenAt: minuteOfDayIn(text) };
  let eatenOn: CalendarDate | undefined;
  try {
    eatenOn = CalendarDate.parse(both[1] as string);
  } catch {
    eatenOn = undefined;
  }
  return { eatenOn, eatenAt: both[2] === undefined ? undefined : minuteOfDayIn(both[2]) };
}
