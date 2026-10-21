import type { MissedPeriod } from '../engine/MissedPeriod';

/** The missed-period question at the recovery check-in (MM-116). */
export function missedPeriodQuestionText(missed: MissedPeriod): string {
  return `No period marked for ${missed.daysSince} days. Is that expected?`;
}
