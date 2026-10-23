import type { CalendarDate } from '../domain/CalendarDate';
import type { Clock } from '../domain/integration/Clock';
import { minuteOfDayNow } from '../state/minuteOfDayNow';

/**
 * The time eaten a new entry for `day` starts with (MM-570): the minute it
 * is now on `clock` when it is logged for today, and none for any other
 * day, where now says nothing about when it was eaten.
 */
export function eatenAtWhenLogged(day: CalendarDate, clock: Clock): number | undefined {
  return day.epochDay === clock.today().epochDay ? minuteOfDayNow(clock) : undefined;
}
