import type { InsightSafeguards } from './InsightSafeguards';

/**
 * Whether a weigh-in's explanation (MM-142) is kept back: under 18, with an
 * eating-disorder history (nothing is said about weight or the body,
 * MM-141), or when weight is hidden (MM-118).
 */
export function weightJumpWithheld(safeguards: InsightSafeguards): boolean {
  return !safeguards.adult || safeguards.eatingDisorderHistory || safeguards.weightHidden;
}
