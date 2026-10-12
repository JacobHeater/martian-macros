/**
 * The nearest whole number, with a half going away from zero: 2.5 to 3 and
 * -2.5 to -3. This is what Dart's `round()` does, and every rounding rule
 * carried over from the Dart engine depends on it. `Math.round` sends -2.5
 * to -2.
 */
export function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}
