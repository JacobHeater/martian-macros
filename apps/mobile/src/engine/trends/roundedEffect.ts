import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';

/**
 * `value` rounded to the nearest `step`, as it will be said (MM-605), with
 * no signed zero (MM-341).
 */
export function roundedEffect(value: number, step: number): number {
  const rounded = step > 0 ? roundHalfAwayFromZero(value / step) * step : value;
  // Clears float noise from the multiplication (0.30000000000000004), and turns -0 into 0.
  const clean = Number(rounded.toPrecision(12));
  return clean === 0 ? 0 : clean;
}
