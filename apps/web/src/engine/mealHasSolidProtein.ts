import { ProteinSpreadRule } from './ProteinSpreadRule';

/**
 * Whether a meal with `proteinG` of protein carries the marker for someone
 * of `weightKg` (MM-125). No marker is not a failure and says nothing.
 */
export function mealHasSolidProtein({ proteinG, weightKg }: { proteinG: number; weightKg: number }): boolean {
  return weightKg > 0 && proteinG >= ProteinSpreadRule.markerGPerKg * weightKg;
}
