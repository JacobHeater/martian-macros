/**
 * `value` with exactly `digits` decimals, as Dart's `toStringAsFixed`
 * writes it. The same as `toFixed`, except for negative zero, which Dart
 * writes with its sign ("-0.0") and JavaScript without.
 */
export function toStringAsFixed(value: number, digits: number): string {
  const text = value.toFixed(digits);
  return Object.is(value, -0) ? `-${text}` : text;
}
