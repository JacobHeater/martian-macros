import type { ExactAlarms } from '../domain/integration/ExactAlarms';
import type { ReminderTiming } from '../domain/ReminderTiming';

/**
 * `ExactAlarms` with no phone behind it (MM-248), for tests and demos. By
 * default exact alarms are allowed, as on Android 12 and 13 or an iPhone.
 */
export class InMemoryExactAlarms implements ExactAlarms {
  /** Whether exact alarms are allowed now. */
  held: boolean;

  /** Whether the person has been asked. */
  asked: boolean;

  /** What the person chooses in the phone's setting. */
  allowInSetting: boolean;

  /** How many times the phone's setting has been opened. */
  settingOpened = 0;

  constructor({
    held = true,
    asked = false,
    allowInSetting = true,
  }: { held?: boolean; asked?: boolean; allowInSetting?: boolean } = {}) {
    this.held = held;
    this.asked = asked;
    this.allowInSetting = allowInSetting;
  }

  async timing(): Promise<ReminderTiming> {
    if (this.held) return 'onTheMinute';
    return this.asked ? 'withinAnHour' : 'notAsked';
  }

  async openSetting(): Promise<ReminderTiming> {
    this.settingOpened++;
    this.asked = true;
    this.held = this.allowInSetting;
    return this.timing();
  }

  async notNow(): Promise<ReminderTiming> {
    this.asked = true;
    return this.timing();
  }
}
