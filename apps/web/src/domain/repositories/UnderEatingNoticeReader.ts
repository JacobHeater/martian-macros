import type { Watched } from '../../lang/Watched';
import type { CalendarDate } from '../CalendarDate';

/** Reads when the under-eating notice was last dismissed (MM-114). */
export interface UnderEatingNoticeReader {
  /** The day it was dismissed, then each change; undefined if never. */
  watchUnderEatingDismissedOn(): Watched<CalendarDate | undefined>;
}
