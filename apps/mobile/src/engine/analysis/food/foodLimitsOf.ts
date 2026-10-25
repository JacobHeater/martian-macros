import type { Caution } from '../../../domain/Caution';
import type { InsightSafeguards } from '../../InsightSafeguards';
import type { FoodLimits } from './FoodLimits';

/** What the safeguards leave of the food analysis (MM-606's Decisions, MM-612's). */
export function foodLimitsOf(safeguards: InsightSafeguards): FoodLimits {
  const has = (c: Caution) => safeguards.cautions.has(c);
  return {
    nothing: has('bariatricSurgery'),
    minorOrPaused: !safeguards.adult || safeguards.paused,
    underEating: safeguards.underEating,
    proteinOnly: safeguards.eatingDisorderHistory || has('eatingDisorderHistory'),
    noLowering: has('pregnancy') || has('breastfeeding') || has('underweight') || has('lowBodyWeight'),
    noMoreProtein: has('chronicKidneyDisease'),
    noCarbLowering: has('insulinOrSulfonylurea'),
  };
}
