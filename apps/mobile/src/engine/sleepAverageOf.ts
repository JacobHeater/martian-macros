import type { CalendarDate } from '../domain/CalendarDate';
import type { SleepNight } from '../domain/SleepNight';
import type { SleepAverage } from './SleepAverage';
import { SleepRule } from './SleepRule';

/**
 * The average night over the `windowNights` ending on `through` (MM-252),
 * or undefined when no night in the window was recorded. Nights outside the
 * window, and nights after `through`, are not counted.
 */
export function sleepAverageOf({
  nights,
  through,
  windowNights = SleepRule.windowNights,
}: {
  nights: readonly SleepNight[];
  through: CalendarDate;
  windowNights?: number;
}): SleepAverage | undefined {
  const from = through.addDays(1 - windowNights);
  const counted = nights.filter((night) => !night.date.isBefore(from) && !night.date.isAfter(through));
  if (counted.length === 0) return undefined;
  return {
    averageMinutes: counted.reduce((sum, night) => sum + night.minutesAsleep, 0) / counted.length,
    nights: counted.length,
    from,
    to: through,
  };
}
