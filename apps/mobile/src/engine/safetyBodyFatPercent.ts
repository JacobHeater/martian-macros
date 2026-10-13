import type { BodyFatEstimate } from './BodyFatEstimate';
import { cautiousBodyFatPercent } from './cautiousBodyFatPercent';
import { safetyBodyFatDeadbandPercent } from './safetyBodyFatConstants';

/**
 * `cautiousBodyFatPercent`, held steady against small moves: the figure
 * changes only when the cautious value has moved more than
 * `safetyBodyFatDeadbandPercent` from `previous`, the value used at the last
 * check-in. An estimate hovering at a threshold therefore cannot flip a rule
 * from one check-in to the next.
 */
export function safetyBodyFatPercent(
  estimate: BodyFatEstimate,
  { previous }: { previous?: number | undefined } = {},
): number {
  const cautious = cautiousBodyFatPercent(estimate);
  if (previous === undefined) return cautious;
  return Math.abs(cautious - previous) > safetyBodyFatDeadbandPercent ? cautious : previous;
}
