import type { CalendarDate } from '../domain/CalendarDate';
import type { IntakeDay } from '../domain/IntakeDay';
import { styleChange } from './styleChange';

/**
 * The first day of the latest logging-style regime in `days` (ascending),
 * if the user switched styles (e.g. hand portions to a food scale): the
 * split, with at least `minDaysPerSegment` days on each side, whose change
 * in style (`styleChange`) is largest and above `threshold`.
 *
 * Shared by the expenditure estimate (MM-27), which restarts its window
 * there, and the trend engine (MM-605), which takes it as a forced boundary
 * and reads a shift beside it as data quality, not an eating change.
 */
export function styleSwitchOf(
  days: readonly IntakeDay[],
  threshold: number,
  minDaysPerSegment: number,
): CalendarDate | undefined {
  let best: CalendarDate | undefined;
  let bestChange = threshold;
  for (let i = minDaysPerSegment; i <= days.length - minDaysPerSegment; i++) {
    const change = styleChange(days.slice(0, i), days.slice(i));
    if (change > bestChange) {
      bestChange = change;
      best = (days[i] as IntakeDay).date;
    }
  }
  return best;
}
