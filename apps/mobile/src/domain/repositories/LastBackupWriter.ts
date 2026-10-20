import type { CalendarDate } from '../CalendarDate';

/** Records that a backup was made (MM-63). */
export interface LastBackupWriter {
  saveLastBackupOn(day: CalendarDate): Promise<void>;
}
