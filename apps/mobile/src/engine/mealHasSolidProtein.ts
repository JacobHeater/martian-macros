import { ProteinSpreadRule } from './ProteinSpreadRule';
import { SafetyBounds } from './SafetyBounds';

/**
 * Whether a meal with `proteinG` of protein carries the marker for someone
 * of `weightKg` and `heightCm` (MM-125). The threshold is per kg of
 * reference weight, the weight the protein minimum scales with, so a heavy
 * person's marker is not out of reach. No marker is not a failure and says
 * nothing.
 */
export function mealHasSolidProtein({
  proteinG,
  weightKg,
  heightCm,
}: {
  proteinG: number;
  weightKg: number;
  heightCm: number;
}): boolean {
  if (weightKg <= 0 || heightCm <= 0) return false;
  const reference = SafetyBounds.referenceWeightKg({ weightKg, heightCm });
  return proteinG >= ProteinSpreadRule.markerGPerKg * reference;
}
