import type { Watched } from '../../lang/Watched';
import type { ReminderSetting } from '../ReminderSetting';

/** Reads reminder settings (MM-146). */
export interface ReminderReader {
  /**
   * The stored settings, in the order of `ReminderKind`, then again after
   * each change. A reminder that was never set is absent.
   */
  watchReminders(): Watched<ReminderSetting[]>;
}
