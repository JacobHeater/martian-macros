import { clamp } from '../lang/clamp';
import { forbesConstantKg } from './partitionConstants';

/**
 * Fraction of a body-weight change that is fat-free mass.
 *
 * Uses the Forbes curve (leaner people lose proportionally more lean mass),
 * halved for resistance-trained users in a deficit, since training plus
 * adequate protein blunts lean-mass loss. The training adjustment is a
 * modelling assumption, not a fitted constant; revisit with simulator data.
 */
export function leanFractionOfChange({
  fatMassKg,
  losing,
  resistanceTrained,
}: {
  fatMassKg: number;
  losing: boolean;
  resistanceTrained: boolean;
}): number {
  const fm = Math.max(fatMassKg, 1);
  let p = forbesConstantKg / (forbesConstantKg + fm);
  if (losing && resistanceTrained) p *= 0.5;
  return clamp(p, 0, 1);
}
