import type { CalendarDate } from '../domain/CalendarDate';
import { deficitStartOn } from './deficitStartOn';
import type { TargetsRecord } from './TargetsRecord';

/**
 * Whole weeks the user has been in an unbroken deficit as of `today`.
 *
 * A gap of two weeks or more with nothing recorded counts as a break
 * (MM-147): the app does not know what was eaten, and assuming the deficit
 * continued would force a diet break on someone who has just had one. Pass
 * the first day back as `restartOn`. The run starts on `deficitStartOn`.
 */
export function consecutiveDeficitWeeks(
  history: readonly TargetsRecord[],
  today: CalendarDate,
  { restartOn }: { restartOn?: CalendarDate | undefined } = {},
): number {
  const start = deficitStartOn(history, today, { restartOn });
  if (start === undefined) return 0;
  const days = start.daysUntil(today);
  return days <= 0 ? 0 : Math.trunc(days / 7);
}
