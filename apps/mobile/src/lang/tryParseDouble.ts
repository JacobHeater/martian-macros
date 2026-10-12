const pattern = /^[+-]?(?:NaN|Infinity|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)$/;

/**
 * The number written in `text`, or undefined when it is not one. Accepts what
 * Dart's `double.tryParse` accepts ("12", "12.", ".5", "1e3", with spaces
 * around) and nothing more: `Number("")` is 0 and `parseFloat("12abc")` is
 * 12, and neither may pass for a typed amount.
 */
export function tryParseDouble(text: string): number | undefined {
  const trimmed = text.trim();
  return pattern.test(trimmed) ? Number(trimmed) : undefined;
}
