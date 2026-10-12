import type { Watched } from '../../lang/Watched';
import type { CalendarDate } from '../CalendarDate';

/** Reads when the recovery check-in was last skipped (MM-116). */
export interface RecoverySkipReader {
  /** The day it was skipped, then each change; undefined if never. */
  watchRecoveryCheckInSkippedOn(): Watched<CalendarDate | undefined>;
}
