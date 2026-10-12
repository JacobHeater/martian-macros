import type { IntakeDay } from '../domain/IntakeDay';

/**
 * The days of `days` that can be taken as whole days of eating (MM-27): a
 * day marked complete always, a day marked partial never, and an unmarked
 * day when it is not far below the window's typical intake (at least
 * `partialDayFraction` of the 75th percentile, which stays among the fully
 * logged days even when a third of days are partial).
 *
 * One rule for the expenditure estimate, the adherence summary (MM-149) and
 * the under-eating notice (MM-114), so they always agree on which days count.
 */
export function usableIntakeDays(
  days: readonly IntakeDay[],
  { partialDayFraction = 0.65 }: { partialDayFraction?: number } = {},
): IntakeDay[] {
  const candidates = days.filter((d) => d.completeness !== 'partial');
  if (candidates.length === 0) return [];
  const typical = percentile(
    candidates.map((d) => d.kcal),
    0.75,
  );
  const threshold = typical * partialDayFraction;
  return candidates.filter((d) => d.completeness === 'complete' || (d.kcal > 0 && d.kcal >= threshold));
}

/** Linear-interpolated percentile, `p` in 0–1. */
function percentile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const rank = p * (sorted.length - 1);
  const lo = sorted[Math.floor(rank)] as number;
  const hi = sorted[Math.ceil(rank)] as number;
  return lo + (hi - lo) * (rank - Math.floor(rank));
}
