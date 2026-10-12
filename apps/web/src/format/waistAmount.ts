import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import type { Fmt } from './Fmt';

/**
 * A size of waist change as shown: to the half centimeter or the quarter
 * inch, without a sign. Finer would be false precision for a tape
 * (MM-155).
 */
export function waistAmount(cm: number, fmt: Fmt): string {
  const step = fmt.imperial ? 0.25 : 0.5;
  const value = roundHalfAwayFromZero(fmt.lengthFromCm(Math.abs(cm)) / step) * step;
  return `${value} ${fmt.lengthUnit}`;
}
