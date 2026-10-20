import type { CalendarDate } from '../domain/CalendarDate';

/** The file a backup is saved as: the app's name and the day, so a folder of them sorts by date (MM-63). */
export const backupFileName = (day: CalendarDate): string => `martian-macros-${day.toString()}.mmbackup`;
