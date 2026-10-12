import type { CalendarDate } from '../CalendarDate';

/**
 * Records that the recovery check-in was skipped for the week (MM-116).
 * No answers are stored for a skipped week.
 */
export interface RecoverySkipWriter {
  saveRecoveryCheckInSkippedOn(day: CalendarDate): Promise<void>;
}
