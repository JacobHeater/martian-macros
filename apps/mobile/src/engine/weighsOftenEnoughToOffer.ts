import type { CalendarDate } from '../domain/CalendarDate';

/** How many days of the last fourteen with more than one weigh-in make the offer (MM-118). */
const daysWithSeveral = 5;
const windowDays = 14;

/**
 * Whether the person has weighed more than once a day on five or more of
 * the last fourteen days (MM-118): the pattern on which the weight display
 * setting is offered, once, with no comment on the behavior. `days` is how
 * many readings each day had.
 */
export function weighsOftenEnoughToOffer({
  days,
  today,
}: {
  days: readonly { date: CalendarDate; readings: number }[];
  today: CalendarDate;
}): boolean {
  const from = today.addDays(1 - windowDays);
  const several = days.filter((day) => day.readings > 1 && !day.date.isBefore(from) && !day.date.isAfter(today));
  return new Set(several.map((day) => day.date.epochDay)).size >= daysWithSeveral;
}
