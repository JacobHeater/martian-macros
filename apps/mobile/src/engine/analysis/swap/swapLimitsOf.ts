import type { Caution } from '../../../domain/Caution';
import type { GoalMode } from '../../../domain/GoalMode';
import type { InsightSafeguards } from '../../InsightSafeguards';
import type { SwapLimits } from './SwapLimits';

/** Cautions under which no swap lowers calories (MM-607). */
const noLowering: readonly Caution[] = ['pregnancy', 'breastfeeding', 'underweight', 'lowBodyWeight'];

/**
 * What the safeguards leave a swap (MM-617), as MM-607's trade has them;
 * undefined when they leave none: under 18, paused, the under-eating
 * finding, bariatric surgery, or an eating-disorder history (in the
 * safeguards or the cautions), where no food is named at all.
 */
export function swapLimitsOf(safeguards: InsightSafeguards, extra: ReadonlySet<Caution>, goal: GoalMode): SwapLimits | undefined {
  const cautions = new Set<Caution>([...safeguards.cautions, ...extra]);
  if (!safeguards.adult || safeguards.paused || safeguards.underEating || safeguards.eatingDisorderHistory) return undefined;
  if (cautions.has('eatingDisorderHistory') || cautions.has('bariatricSurgery')) return undefined;
  return {
    goal,
    noFewerKcal: noLowering.some((c) => cautions.has(c)),
    noCarbDrop: cautions.has('insulinOrSulfonylurea'),
    noProteinGain: cautions.has('chronicKidneyDisease'),
  };
}
