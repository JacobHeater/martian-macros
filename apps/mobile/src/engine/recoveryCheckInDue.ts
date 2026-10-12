import type { CalendarDate } from '../domain/CalendarDate';
import type { RecoveryCheckIn } from '../domain/RecoveryCheckIn';
import { RecoveryRule } from './RecoveryRule';

/**
 * Whether to offer the weekly recovery check-in on `today` (MM-116): from a
 * week after setup, when it has been neither answered nor skipped in the
 * last `RecoveryRule.everyDays` days, and not during a pause (MM-148).
 */
export function recoveryCheckInDue({
  today,
  onboardedOn,
  checkIns,
  skippedOn,
  paused = false,
}: {
  today: CalendarDate;
  onboardedOn: CalendarDate;
  checkIns: Iterable<RecoveryCheckIn>;
  skippedOn: CalendarDate | undefined;
  paused?: boolean;
}): boolean {
  if (paused) return false;
  if (onboardedOn.daysUntil(today) < RecoveryRule.everyDays) return false;
  const recent = (day: CalendarDate) => !day.isAfter(today) && day.daysUntil(today) < RecoveryRule.everyDays;
  if (skippedOn !== undefined && recent(skippedOn)) return false;
  for (const c of checkIns) {
    if (recent(c.date)) return false;
  }
  return true;
}
