import type { CalendarDate } from '../CalendarDate';
import type { Watched } from '../../lang/Watched';

/** The day the line about label accuracy was dismissed, if it was (MM-123). */
export interface LabelNoteReader {
  watchLabelNoteDismissedOn(): Watched<CalendarDate | undefined>;
}
