import type { CalendarDate } from '../CalendarDate';

/** Writes the setting for the easy-to-miss line. */
export interface EasyToMissWriter {
  saveEasyToMissEnabled(enabled: boolean): Promise<void>;

  /** Records that the line was shown on `day`. */
  markEasyToMissShown(day: CalendarDate): Promise<void>;
}
