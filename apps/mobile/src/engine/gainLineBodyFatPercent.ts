import { clamp } from '../lang/clamp';
import type { BodyFatBasis } from './BodyFatBasis';
import type { BodyFatEstimate } from './BodyFatEstimate';
import { quartileSigmas } from './safetyBodyFatConstants';

/**
 * The body fat a lean gain's stop line is read against (MM-129, MM-36): the
 * upper end of the range, the estimate plus `quartileSigmas` deviations, so
 * a gain ends once it is plausibly past the line, never later than the point
 * would end it. A figure the user entered counts as exact, as MM-34 shows it.
 */
export function gainLineBodyFatPercent(bodyFat: BodyFatEstimate, basis: BodyFatBasis): number {
  if (basis === 'yourFigure') return bodyFat.percent;
  return clamp(bodyFat.percent + quartileSigmas * bodyFat.sigmaPercent, 2, 70);
}
