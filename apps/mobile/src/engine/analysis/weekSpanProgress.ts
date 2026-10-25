import type { CalendarDate } from '../../domain/CalendarDate';
import { TrendRule } from '../trends/TrendRule';

/**
 * How far the data is from 7d while the switcher offers 1d only (MM-620):
 * the days still to go to a week since the first entry, or else the fully
 * logged days among the last 7 through yesterday against the 60% the
 * coverage rule needs (5). Undefined with nothing logged. The rule is
 * `supportedAnalysisSpans`'s, so the two always agree.
 */
export function weekSpanProgress({
  firstEntryOn,
  wholeDays,
  today,
}: {
  firstEntryOn: CalendarDate | undefined;
  wholeDays: ReadonlySet<number>;
  today: CalendarDate;
}): { readonly daysToGo: number } | { readonly fullyLogged: number; readonly needed: number } | undefined {
  if (firstEntryOn === undefined) return undefined;
  const span = 7;
  const since = firstEntryOn.daysUntil(today);
  if (since < span) return { daysToGo: span - since };
  let fullyLogged = 0;
  for (let i = 1; i <= span; i++) if (wholeDays.has(today.addDays(-i).epochDay)) fullyLogged++;
  return { fullyLogged, needed: Math.ceil(TrendRule.coverageMinimum * span - 1e-9) };
}
