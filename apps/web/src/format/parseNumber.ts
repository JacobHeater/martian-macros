import { tryParseDouble } from '../lang/tryParseDouble';

/** Parses user-typed numbers, tolerating a comma decimal separator. */
export function parseNumber(text: string): number | undefined {
  return tryParseDouble(text.trim().replaceAll(',', '.'));
}
