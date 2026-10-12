/**
 * Orders two strings by their UTF-16 code units, as Dart's
 * `String.compareTo` does. Not `localeCompare`, whose order depends on the
 * device's language.
 */
export function compareStrings(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}
