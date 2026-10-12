import type { Watched } from '../../lang/Watched';
import type { CalendarDate } from '../CalendarDate';

/** Reads when the welcome-back screen was last put off (MM-147). */
export interface ReturnScreenReader {
  /** The day "Later" was chosen, then each change; undefined if never. */
  watchReturnScreenDismissedOn(): Watched<CalendarDate | undefined>;
}
