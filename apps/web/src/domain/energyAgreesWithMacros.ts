import { atwaterKcal } from './atwaterKcal';

/**
 * The single energy rule (MM-53): energy within the larger of 15% or 20 kcal
 * of what the macros imply, with alcohol at 7 kcal per gram.
 *
 * US labels differ on whether carbohydrate includes fiber, and fiber counts
 * 2 kcal per gram, so it passes if energy matches any of: the macros as
 * stated, carbohydrate with its fiber at 2 instead of 4, or carbohydrate
 * that already excludes fiber with the fiber added at 2.
 */
export function energyAgreesWithMacros({
  kcal,
  proteinG,
  carbsG,
  fatG,
  fiberG = 0,
  alcoholG = 0,
}: {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  alcoholG?: number;
}): boolean {
  const implied = atwaterKcal({ proteinG, carbsG, fatG }) + 7 * alcoholG;
  const candidates = [implied, implied - 2 * fiberG, implied + 2 * fiberG];
  return candidates.some((c) => {
    const tolerance = c * 0.15 > 20 ? c * 0.15 : 20;
    return Math.abs(kcal - c) <= tolerance;
  });
}
