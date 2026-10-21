import type { CalendarDate } from '../domain/CalendarDate';
import type { PersonalRecord } from './PersonalRecord';

/** A personal record set in a report's month (MM-92, MM-33), with the day of the workout that set it. */
export interface ReportPersonalRecord extends PersonalRecord {
  readonly date: CalendarDate;
}
