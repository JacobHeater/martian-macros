import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';

/** A change as a percent to one place (MM-341): "+1.2%", "−1.2%", and "0.0%" for anything that rounds to none. */
export function signedPercent(fraction: number): string {
  const tenths = roundHalfAwayFromZero(fraction * 1000) + 0;
  if (tenths === 0) return '0.0%';
  return `${tenths > 0 ? '+' : '−'}${toStringAsFixed(Math.abs(tenths) / 10, 1)}%`;
}
