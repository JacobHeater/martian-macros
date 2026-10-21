import type { ReminderTiming } from '../ReminderTiming';

/**
 * Whether the phone lets a reminder arrive on the minute (MM-248):
 * Android's exact-alarm permission. Asked for once, from the reminder
 * settings, and never on first run. Nothing waits on the answer.
 */
export interface ExactAlarms {
  /** How reminders are timed now. Asks nothing. */
  timing(): Promise<ReminderTiming>;

  /**
   * Opens the phone's own setting for it, and answers the timing once the
   * person is back. They have been asked, whatever they chose.
   */
  openSetting(): Promise<ReminderTiming>;

  /** The person answered "Not now" to the reason: asked, and not asked again. */
  notNow(): Promise<ReminderTiming>;
}
