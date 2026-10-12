import { CalendarDate } from '../domain/CalendarDate';
import type { WeightObservation } from '../domain/WeightObservation';
import type { DayWeighIn } from '../healthIngest/DayWeighIn';

/**
 * The weigh-ins the app works from (MM-68, MM-71): what the user typed,
 * and for every other day the imported weigh-in that counts, oldest first.
 * A typed value for a day is used and the import for that day is kept but
 * not used.
 *
 * An imported reading that cannot be a body weight, or is dated after
 * `today`, is left out, as a typed one would be refused.
 */
export function mergeWeighIns({
  typed,
  imported,
  today,
}: {
  typed: readonly WeightObservation[];
  imported: readonly DayWeighIn[];
  today: CalendarDate;
}): WeightObservation[] {
  const byDay = new Map<number, WeightObservation>();
  for (const weighIn of imported) {
    const date = CalendarDate.fromDate(weighIn.day);
    if (date.isAfter(today) || weighIn.kg < 20 || weighIn.kg > 500) continue;
    byDay.set(date.epochDay, { date, weightKg: weighIn.kg });
  }
  for (const weight of typed) byDay.set(weight.date.epochDay, weight);
  return [...byDay.keys()].sort((a, b) => a - b).map((day) => byDay.get(day) as WeightObservation);
}
