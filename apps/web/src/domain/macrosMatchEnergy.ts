import { energyAgreesWithMacros } from './energyAgreesWithMacros';

/**
 * Whether stated energy is consistent with stated macros: within the
 * larger of 15% or 20 kcal. Used to catch typos at entry time.
 */
export function macrosMatchEnergy({
  kcal,
  proteinG,
  carbsG,
  fatG,
  alcoholG = 0,
}: {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  alcoholG?: number;
}): boolean {
  return energyAgreesWithMacros({ kcal, proteinG, carbsG, fatG, alcoholG });
}
