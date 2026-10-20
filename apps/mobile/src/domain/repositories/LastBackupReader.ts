import type { CalendarDate } from '../CalendarDate';
import type { Watched } from '../../lang/Watched';

/** When the last backup was made on this phone, if ever (MM-63). */
export interface LastBackupReader {
  watchLastBackupOn(): Watched<CalendarDate | undefined>;
}
