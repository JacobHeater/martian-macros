const pattern = /^[+-]?(?:\d+|0[xX][0-9a-fA-F]+)$/;

/**
 * The whole number written in `text`, or undefined when it is not one.
 * Accepts what Dart's `int.tryParse` accepts ("12", "-3", "0x1f", with
 * spaces around) and nothing more: `parseInt("12abc")` is 12 and
 * `parseInt("1.9")` is 1, and neither may pass for a whole number.
 */
export function tryParseInt(text: string): number | undefined {
  const trimmed = text.trim();
  if (!pattern.test(trimmed)) return undefined;
  const negative = trimmed.startsWith('-');
  const unsigned = Number(trimmed.replace(/^[+-]/, ''));
  return negative ? -unsigned : unsigned;
}
