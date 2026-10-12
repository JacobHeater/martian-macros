import type { PlannedReminder } from '../PlannedReminder';

/**
 * Shows reminders on the device at their times (MM-146). Local only: no
 * push service, no token, nothing leaves the device.
 */
export interface ReminderScheduler {
  /**
   * Asks the system for permission to show notifications. True when it is
   * granted. Called only when the user turns a reminder on.
   */
  requestPermission(): Promise<boolean>;

  /** Cancels everything scheduled before and schedules exactly `reminders`. */
  replaceAll(reminders: readonly PlannedReminder[]): Promise<void>;
}
