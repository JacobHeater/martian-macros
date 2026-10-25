import type { FoodLimits } from '../food/FoodLimits';
import type { CoachFollowUp } from './CoachFollowUp';

/**
 * Whether the safeguards let a follow-up be said (MM-617, keeping MM-606's
 * and MM-612's limits).
 *
 * - Bariatric surgery: nothing.
 * - Under 18, paused, an eating-disorder history or the under-eating
 *   finding: only advice taken of a protein add.
 * - Pregnancy, breastfeeding, underweight, low body weight: nothing about
 *   eating less (no food back, no day over, no fat over, nothing skipped);
 *   protein short and a protein add taken may show.
 * - Kidney disease: nothing for more protein.
 */
export function followUpAllowed(f: CoachFollowUp, limits: FoodLimits): boolean {
  if (limits.nothing) return false;
  const proteinAdd = f.kind === 'adviceTaken' && f.order === 'add' && f.nutrient === 'protein';
  const moreProtein = proteinAdd || f.kind === 'repeatProteinShort';
  if (limits.noMoreProtein && moreProtein) return false;
  if (limits.minorOrPaused || limits.proteinOnly || limits.underEating) return proteinAdd;
  if (limits.noLowering) return moreProtein;
  return true;
}
