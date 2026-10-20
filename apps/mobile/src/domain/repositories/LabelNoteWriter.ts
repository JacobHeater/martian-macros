import type { CalendarDate } from '../CalendarDate';

/** Records that the line about label accuracy was dismissed (MM-123). */
export interface LabelNoteWriter {
  saveLabelNoteDismissedOn(day: CalendarDate): Promise<void>;
}
