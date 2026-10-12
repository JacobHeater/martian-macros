import type { CalendarDate } from '../domain/CalendarDate';
import type { WeightEvent } from '../domain/WeightEvent';
import { weightEventNoiseMultiplier } from './weightEventConstants';

/** Noise windows for transient events that passed the rolling cap. */
export function passingWeightEventNoise(passingEvents: Iterable<WeightEvent>): (date: CalendarDate) => number {
  const noisyDays = new Set<number>();
  for (const event of passingEvents) {
    const daysAfter = event.type === 'illness' ? 7 : 4;
    for (let day = event.date.epochDay - 1; day <= event.date.epochDay + daysAfter; day++) {
      noisyDays.add(day);
    }
  }
  return (date) => (noisyDays.has(date.epochDay) ? weightEventNoiseMultiplier : 1);
}
