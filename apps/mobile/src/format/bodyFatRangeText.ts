import type { BodyFatBasis, BodyFatEstimate } from '../engine';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { bodyFatRange } from './bodyFatRange';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/**
 * The Body row's figure (MM-34): the user's own figure as they gave it,
 * otherwise a range and what it rests on, never one number.
 *
 * "14–34% (rough estimate)", "17–31% (from your waist)".
 */
export function bodyFatRangeText(estimate: BodyFatEstimate, basis: BodyFatBasis): string {
  if (basis === 'yourFigure') return `~${whole(estimate.percent)}% (your estimate)`;
  const range = bodyFatRange(estimate);
  return basis === 'waist' ? `${range} (from your waist)` : `${range} (rough estimate)`;
}
