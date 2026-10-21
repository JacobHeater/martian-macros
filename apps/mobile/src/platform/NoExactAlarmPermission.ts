import type { ExactAlarms } from '../domain/integration/ExactAlarms';
import type { ReminderTiming } from '../domain/ReminderTiming';

/**
 * Where no permission stands between a reminder and its minute (MM-248):
 * a browser, which shows no reminder at all. Never asks.
 */
export class NoExactAlarmPermission implements ExactAlarms {
  timing(): Promise<ReminderTiming> {
    return Promise.resolve('onTheMinute');
  }

  openSetting(): Promise<ReminderTiming> {
    return this.timing();
  }

  notNow(): Promise<ReminderTiming> {
    return this.timing();
  }
}
