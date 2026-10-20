import { DailyTargets } from '../engine/DailyTargets';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

/** Rounds `value` to the nearest multiple of `step`. */
const toNearest = (value: number, step: number) => roundHalfAwayFromZero(value / step) * step + 0;

/**
 * The targets as the screens show them (MM-123): calories to the nearest
 * 25 kcal, grams to the nearest 5 g, since food cannot be measured more
 * finely than that. Stored and computed values are never rounded; with
 * `exact` on, the person asked to see them as they are.
 */
export function displayTargets(targets: DailyTargets, { exact = false }: { exact?: boolean } = {}): DailyTargets {
  if (exact) return targets;
  return new DailyTargets({
    kcal: toNearest(targets.kcal, 25),
    proteinG: toNearest(targets.proteinG, 5),
    proteinMinimumG: targets.proteinMinimumG === undefined ? undefined : toNearest(targets.proteinMinimumG, 5),
    fatG: toNearest(targets.fatG, 5),
    carbsG: toNearest(targets.carbsG, 5),
    weeklyRateFraction: targets.weeklyRateFraction,
    flags: targets.flags,
  });
}
