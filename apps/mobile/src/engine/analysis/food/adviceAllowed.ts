import type { CoachAdvice } from '../CoachAdvice';
import type { FoodLimits } from './FoodLimits';

/**
 * Whether the safeguards let an order be said (MM-617, keeping MM-606's,
 * MM-607's and MM-612's limits). Run on every order before a finding is
 * kept; a fix left with none is not said.
 *
 * - An eating-disorder history: a protein add naming no food, and nothing else.
 * - Under 18, paused, or the under-eating finding: adds only.
 * - Pregnancy, breastfeeding, underweight, low body weight: no skip, halve or
 *   limit, and no swap to fewer calories.
 * - Kidney disease: no add of protein.
 */
export function adviceAllowed(advice: CoachAdvice, limits: FoodLimits): boolean {
  if (limits.nothing) return false;
  if (limits.proteinOnly) {
    return advice.kind === 'add' && advice.nutrient === 'protein' && advice.addFood === undefined && advice.food === undefined;
  }
  if ((limits.minorOrPaused || limits.underEating) && advice.kind !== 'add') return false;
  if (limits.noLowering) {
    if (advice.kind === 'skip' || advice.kind === 'halve' || advice.kind === 'limitRestOfDay') return false;
    if (advice.kind === 'swap') {
      const kcal = advice.replacement?.kcal;
      if (kcal === undefined || advice.food === undefined || kcal < advice.food.kcal) return false;
    }
  }
  if (limits.noMoreProtein && advice.kind === 'add' && advice.nutrient === 'protein') return false;
  return true;
}
