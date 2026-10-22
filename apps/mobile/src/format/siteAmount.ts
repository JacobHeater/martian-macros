import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';
import type { Fmt } from './Fmt';

/**
 * A size of tape change as shown, without a sign (MM-156): to the half
 * centimeter, with its one decimal ("1.0 cm"), or the quarter inch. Finer
 * would be false precision for a tape (MM-155).
 */
export function siteAmount(cm: number, fmt: Fmt): string {
  const step = fmt.imperial ? 0.25 : 0.5;
  const value = roundHalfAwayFromZero(fmt.lengthFromCm(Math.abs(cm)) / step) * step;
  return `${fmt.imperial ? String(value) : toStringAsFixed(value, 1)} ${fmt.lengthUnit}`;
}
