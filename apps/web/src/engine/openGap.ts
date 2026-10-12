import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import type { Pause } from '../domain/Pause';
import type { WeightObservation } from '../domain/WeightObservation';
import type { ActivityGap } from './ActivityGap';
import { activityGaps } from './activityGaps';

/**
 * The gap the user is returning from on `today`: one that runs up to
 * yesterday with nothing recorded today either; otherwise undefined.
 */
export function openGap({
  weights,
  intake,
  today,
  pauses = [],
}: {
  weights: Iterable<WeightObservation>;
  intake: Iterable<IntakeDay>;
  today: CalendarDate;
  pauses?: Iterable<Pause>;
}): ActivityGap | undefined {
  const allWeights = [...weights];
  const allIntake = [...intake];
  const allPauses = [...pauses];
  const gaps = activityGaps({ weights: allWeights, intake: allIntake, today, pauses: allPauses });
  const last = gaps[gaps.length - 1];
  if (last === undefined) return undefined;
  const activeToday =
    allPauses.some((p) => p.covers(today)) ||
    allWeights.some((w) => w.date === today) ||
    allIntake.some((d) => d.date === today && d.kcal > 0);
  return last.returnOn === today && !activeToday ? last : undefined;
}
