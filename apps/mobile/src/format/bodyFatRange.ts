import type { BodyFatEstimate } from '../engine';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';

const whole = (value: number) => roundHalfAwayFromZero(value) + 0;

/** A body-fat estimate's range in whole percent, never its middle (MM-34): "17–31%". */
export function bodyFatRange(estimate: BodyFatEstimate): string {
  return `${whole(estimate.lowerPercent)}–${whole(estimate.upperPercent)}%`;
}
