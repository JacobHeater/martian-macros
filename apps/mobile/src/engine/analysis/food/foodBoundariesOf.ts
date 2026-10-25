import type { CalendarDate } from '../../../domain/CalendarDate';
import type { IntakeDay } from '../../../domain/IntakeDay';
import { styleSwitchOf } from '../../styleSwitchOf';
import type { TargetsRecord } from '../../TargetsRecord';
import type { TrendBoundary } from '../../trends/TrendBoundary';
import type { FoodDay } from './FoodDay';
import { FoodSignalRule } from './FoodSignalRule';

/**
 * The forced boundaries of a food span (MM-605, MM-606): each targets
 * change (`TargetsRecord.effectiveFrom`) after `from` and through `to`, and
 * the logging-style switch over the whole days of `days`, as the
 * expenditure estimate finds it (`styleSwitchOf`).
 */
export function foodBoundariesOf(
  history: readonly TargetsRecord[],
  days: readonly FoodDay[],
  from: CalendarDate,
  to: CalendarDate,
): TrendBoundary[] {
  const boundaries: TrendBoundary[] = history
    .filter((r) => r.effectiveFrom.isAfter(from) && !r.effectiveFrom.isAfter(to))
    .map((r): TrendBoundary => ({ date: r.effectiveFrom, cause: 'targets' }));
  const whole = days.flatMap((d): IntakeDay[] => (d.whole && d.intake !== undefined ? [d.intake] : []));
  const switched = styleSwitchOf(whole, FoodSignalRule.styleSwitchThreshold, FoodSignalRule.styleSwitchMinimumDays);
  if (switched !== undefined) boundaries.push({ date: switched, cause: 'loggingStyle' });
  return boundaries.sort((a, b) => a.date.compareTo(b.date));
}
