import type { IntakeDay } from '../domain/IntakeDay';
import type { Pause } from '../domain/Pause';
import { pauseOn } from './pauseOn';

/**
 * `intake` without the days inside a pause (MM-148): eating on holiday is
 * not the eating the coach is trying to measure.
 *
 * With `keepComplete`, a paused day the user logged and marked complete
 * stays, which is what the expenditure estimate wants: careful logging
 * through a business trip is good data. Anything that judges a day against
 * a target passes false, because nothing on a paused day is judged.
 */
export function withoutPausedDays(
  intake: readonly IntakeDay[],
  pauses: Iterable<Pause>,
  { keepComplete }: { keepComplete: boolean },
): readonly IntakeDay[] {
  const all = [...pauses];
  if (all.length === 0) return intake;
  return intake.filter(
    (day) => pauseOn(all, day.date) === undefined || (keepComplete && day.completeness === 'complete'),
  );
}
