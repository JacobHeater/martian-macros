import { CalendarDate } from '../domain/CalendarDate';
import { SleepNight } from '../domain/SleepNight';
import type { NightOfSleep } from '../healthIngest/NightOfSleep';

/**
 * The nights the app works from (MM-250): what the person typed, and for
 * every other night the imported one that counts, oldest first. A typed
 * night for a day is used and the import for that day is kept but not used,
 * as MM-71 rules for weight.
 *
 * An imported night that cannot be a night (nothing asleep, or more than a
 * day), or is dated after `today`, is left out, as a typed one would be refused.
 */
export function mergeSleepNights({
  typed,
  imported,
  today,
}: {
  typed: readonly SleepNight[];
  imported: readonly NightOfSleep[];
  today: CalendarDate;
}): SleepNight[] {
  const byDay = new Map<number, SleepNight>();
  for (const night of imported) {
    const date = CalendarDate.fromDate(night.day);
    if (date.isAfter(today) || night.minutes < SleepNight.minMinutes || night.minutes > SleepNight.maxMinutes) continue;
    byDay.set(
      date.epochDay,
      new SleepNight({
        date,
        minutesAsleep: night.minutes,
        source: 'imported',
        sourceName: night.sourceName === '' ? undefined : night.sourceName,
      }),
    );
  }
  for (const night of typed) byDay.set(night.date.epochDay, night);
  return [...byDay.keys()].sort((a, b) => a - b).map((day) => byDay.get(day) as SleepNight);
}
