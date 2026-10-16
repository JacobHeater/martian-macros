import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { toStringAsFixed } from '../lang/toStringAsFixed';

/** A load as typed: "225", "102.5". No trailing zero, at most one decimal, as a scale says a weight (MM-350). */
export function loadNumber(value: number): string {
  const rounded = roundHalfAwayFromZero(value * 10) / 10;
  if (Number.isInteger(rounded)) return String(rounded + 0);
  return toStringAsFixed(rounded, 1);
}
