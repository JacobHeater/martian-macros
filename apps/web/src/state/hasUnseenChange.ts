import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import type { TargetsRecord } from '../engine/TargetsRecord';

const whole = (value: number | undefined) => (value === undefined ? undefined : roundHalfAwayFromZero(value) + 0);

/**
 * Whether `record` changed the targets from `previous` in a way the user
 * has not been shown the summary of (MM-138).
 */
export function hasUnseenChange(record: TargetsRecord, previous: TargetsRecord | undefined): boolean {
  if (record.summarySeen || previous === undefined || record.explanation?.previousKcal === undefined) return false;
  const current = record.targets;
  const prior = previous.targets;
  return (
    record.mode !== previous.mode ||
    whole(current.kcal) !== whole(prior.kcal) ||
    whole(current.proteinG) !== whole(prior.proteinG) ||
    whole(current.proteinMinimumG) !== whole(prior.proteinMinimumG) ||
    whole(current.carbsG) !== whole(prior.carbsG) ||
    whole(current.fatG) !== whole(prior.fatG) ||
    current.weeklyRateFraction !== prior.weeklyRateFraction
  );
}
