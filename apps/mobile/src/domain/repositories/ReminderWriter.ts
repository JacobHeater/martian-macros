import type { ReminderSetting } from '../ReminderSetting';

/** Writes reminder settings (MM-146). */
export interface ReminderWriter {
  /** Adds `setting`, or replaces the one of the same kind. */
  saveReminder(setting: ReminderSetting): Promise<void>;
}
