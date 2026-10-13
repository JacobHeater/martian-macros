import type { BodyFatEstimate } from './BodyFatEstimate';
import { quartileSigmas } from './safetyBodyFatConstants';

/**
 * Whether the user is clearly above `thresholdPercent`: the chance of being
 * under it is a quarter or less. For offers that need the user to be clearly
 * on one side, such as the fastest pace of loss.
 */
export function bodyFatClearlyAbove(estimate: BodyFatEstimate, thresholdPercent: number): boolean {
  return estimate.percent - quartileSigmas * estimate.sigmaPercent >= thresholdPercent;
}
