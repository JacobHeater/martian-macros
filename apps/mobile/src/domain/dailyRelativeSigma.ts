import { QuantitySource } from './QuantitySource';

/**
 * Combines independent per-entry errors into a relative sigma for the day.
 *
 * `entries` are [kcal, source] pairs. Returns 0 for an empty day.
 */
export function dailyRelativeSigma(entries: Iterable<readonly [kcal: number, source: QuantitySource]>): number {
  let total = 0;
  let variance = 0;
  for (const [kcal, source] of entries) {
    total += kcal;
    const sd = kcal * QuantitySource.relativeSigma(source);
    variance += sd * sd;
  }
  return total <= 0 ? 0 : Math.sqrt(variance) / total;
}
