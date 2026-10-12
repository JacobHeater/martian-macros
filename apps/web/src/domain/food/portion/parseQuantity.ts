import { tryParseDouble } from '../../../lang/tryParseDouble';

/**
 * An amount typed by a person: a decimal ("1.5", "0.5") or a simple
 * fraction ("1/2", "1 1/2"). Returns undefined for anything that is not a
 * number above zero, including empty, zero, negative and non-numeric text.
 */
export function parseQuantity(text: string): number | undefined {
  const t = text.trim().replaceAll(',', '.');
  if (t.length === 0) return undefined;
  let value: number | undefined;
  const mixed = /^(\d+)\s+(\d+)\s*\/\s*(\d+)$/.exec(t);
  const fraction = /^(\d+)\s*\/\s*(\d+)$/.exec(t);
  if (mixed !== null) {
    const denominator = Number(mixed[3]);
    if (denominator === 0) return undefined;
    value = Number(mixed[1]) + Number(mixed[2]) / denominator;
  } else if (fraction !== null) {
    const denominator = Number(fraction[2]);
    if (denominator === 0) return undefined;
    value = Number(fraction[1]) / denominator;
  } else if (/^(\d+\.?\d*|\.\d+)$/.test(t)) {
    value = tryParseDouble(t);
  }
  if (value === undefined || !Number.isFinite(value) || value <= 0) return undefined;
  return value;
}
