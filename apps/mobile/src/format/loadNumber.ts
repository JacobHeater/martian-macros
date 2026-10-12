import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';

/** A load as typed: "225", "102.5". No trailing zeros, at most two decimals. */
export function loadNumber(value: number): string {
  const rounded = roundHalfAwayFromZero(value * 100) / 100;
  if (Number.isInteger(rounded)) return String(rounded + 0);
  const text = toStringAsFixed(rounded, 2);
  return text.endsWith('0') ? text.substring(0, text.length - 1) : text;
}
