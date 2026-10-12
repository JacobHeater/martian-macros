import { clamp } from '../lang/clamp';

/** Energy content of fat mass: 39.5 MJ/kg (Hall 2008). */
export const fatMassKcalPerKg = 9440;

/** Energy content of fat-free mass: 7.6 MJ/kg (Hall 2008). */
export const fatFreeMassKcalPerKg = 1815;

/** Forbes' constant: dFFM/dFM = C / FM (Hall 2007 revision of Forbes). */
export const forbesConstantKg = 10.4;

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

/**
 * Energy density of a weight change with lean fraction `leanFraction`,
 * kcal per kg of body weight.
 */
export function energyDensityKcalPerKg(leanFraction: number): number {
  return leanFraction * fatFreeMassKcalPerKg + (1 - leanFraction) * fatMassKcalPerKg;
}

/** Energy density of the weight change implied by `slopeKgPerDay`. */
export function energyDensityForSlope({
  slopeKgPerDay,
  fatMassKg,
  resistanceTrained,
}: {
  slopeKgPerDay: number;
  fatMassKg: number;
  resistanceTrained: boolean;
}): number {
  return energyDensityKcalPerKg(leanFractionOfChange({ fatMassKg, losing: slopeKgPerDay < 0, resistanceTrained }));
}
