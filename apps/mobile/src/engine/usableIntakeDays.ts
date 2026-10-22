import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';

/**
 * The days of `days` that can be taken as whole days of eating (MM-27): a
 * day marked complete always, a day marked partial never, and an unmarked
 * day when it is not far below the window's typical intake.
 *
 * "Far below" is judged against the window's own spread (MM-173): the
 * threshold is `partialDayFraction` of the 75th percentile, which stays
 * among the fully logged days even when a third of days are partial, or
 * lower when the window's top is wide, so a noisy but honest logger's low
 * days are kept. The spread is read from the top alone (the 90th percentile
 * against the 75th), which half-logged days do not reach even when a third
 * of days are half-logged, so a steady logger's half day is still caught.
 *
 * Each day is read against its plan (MM-124): `plannedShare` gives the
 * share of the flat figure the user planned for the day (`plannedDayShare`),
 * and a day's intake is divided by it before the comparison, so a planned
 * lower day eaten as planned sits with the rest rather than below them.
 * Without it every day is planned flat.
 *
 * One rule for the expenditure estimate, the adherence summary (MM-149) and
 * the under-eating notice (MM-114), so they always agree on which days count.
 */
export function usableIntakeDays(
  days: readonly IntakeDay[],
  {
    partialDayFraction = 0.65,
    spreadSigmas = 2.5,
    plannedShare,
  }: { partialDayFraction?: number; spreadSigmas?: number; plannedShare?: ((date: CalendarDate) => number) | undefined } = {},
): IntakeDay[] {
  const candidates = days.filter((d) => d.completeness !== 'partial');
  if (candidates.length === 0) return [];
  const asPlanned = (d: IntakeDay) => {
    const share = plannedShare?.(d.date) ?? 1;
    return share > 0 ? d.kcal / share : d.kcal;
  };
  const kcal = candidates.map(asPlanned);
  const typical = percentile(kcal, 0.75);
  const fixed = typical * partialDayFraction;
  // The top's spread as a standard deviation: for a normal spread the 90th percentile sits 0.607 sigma above the 75th,
  // and the 75th 0.674 sigma above the middle.
  const sigma = (percentile(kcal, 0.9) - typical) / 0.607;
  const middle = typical - 0.674 * sigma;
  const widened = candidates.length >= 7 ? middle - spreadSigmas * sigma : fixed;
  const threshold = Math.min(fixed, widened);
  return candidates.filter((d) => d.completeness === 'complete' || (d.kcal > 0 && asPlanned(d) >= threshold));
}

/** Linear-interpolated percentile, `p` in 0–1. */
function percentile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const rank = p * (sorted.length - 1);
  const lo = sorted[Math.floor(rank)] as number;
  const hi = sorted[Math.ceil(rank)] as number;
  return lo + (hi - lo) * (rank - Math.floor(rank));
}
