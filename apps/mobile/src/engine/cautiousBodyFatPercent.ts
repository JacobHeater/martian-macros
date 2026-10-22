import { clamp } from '../lang/clamp';
import type { BodyFatEstimate } from './BodyFatEstimate';
import { quartileSigmas } from './safetyBodyFatConstants';

/**
 * The body-fat figure the safety thresholds are applied to (MM-132).
 *
 * The loss limit, the protein rule and the energy-availability floor are all
 * stricter for leaner users, so each takes the stricter branch when the user
 * is plausibly on that side: when the chance of being at or under the
 * threshold is a quarter or more. That is the same as comparing the
 * threshold with the estimate less `quartileSigmas` standard deviations.
 *
 * A smart scale may only make this stricter (MM-502): when the estimate
 * joins a scale's readings, the lower of the joined figure and the figure
 * without the scale is taken.
 */
export function cautiousBodyFatPercent(estimate: BodyFatEstimate): number {
  const own = clamp(estimate.percent - quartileSigmas * estimate.sigmaPercent, 2, 70);
  return estimate.withoutScale === undefined ? own : Math.min(own, cautiousBodyFatPercent(estimate.withoutScale));
}
