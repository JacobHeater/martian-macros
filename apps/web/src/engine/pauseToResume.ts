import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import type { WeightObservation } from '../domain/WeightObservation';
import { latestEndedPause } from './latestEndedPause';
import { pauseOn } from './pauseOn';

/**
 * The pause the user is coming out of on `today`, or undefined (MM-148):
 * the latest one that has ended, while no weigh-in has been saved since it
 * ended and no other pause is running. The resume screen asks for that
 * weigh-in.
 */
export function pauseToResume({
  pauses,
  weights,
  today,
}: {
  pauses: Iterable<Pause>;
  weights: Iterable<WeightObservation>;
  today: CalendarDate;
}): Pause | undefined {
  const all = [...pauses];
  if (pauseOn(all, today) !== undefined) return undefined;
  const latest = latestEndedPause(all, today);
  if (latest === undefined) return undefined;
  for (const w of weights) {
    if (w.date.isAfter(latest.to)) return undefined;
  }
  return latest;
}
