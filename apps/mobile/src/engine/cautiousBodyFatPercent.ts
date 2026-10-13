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
 */
export function cautiousBodyFatPercent(estimate: BodyFatEstimate): number {
  return clamp(estimate.percent - quartileSigmas * estimate.sigmaPercent, 2, 70);
}
