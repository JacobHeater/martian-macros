import type { ExactAlarms } from '../domain/integration/ExactAlarms';
import { ReminderTiming } from '../domain/ReminderTiming';
import type { MmExactAlarmsApi } from './MmExactAlarmsApi';

/** An answer the app does not know is taken as the inexact one: nothing is promised that may not hold. */
const known = ({ timing }: { timing: string }): ReminderTiming =>
  (ReminderTiming.values as readonly string[]).includes(timing) ? (timing as ReminderTiming) : 'withinAnHour';

/** `ExactAlarms` over the reminders plugin (MM-248). */
export class NativeExactAlarms implements ExactAlarms {
  private readonly api: MmExactAlarmsApi;

  constructor(api: MmExactAlarmsApi) {
    this.api = api;
  }

  async timing(): Promise<ReminderTiming> {
    return known(await this.api.exactAlarms());
  }

  async openSetting(): Promise<ReminderTiming> {
    return known(await this.api.openExactAlarmSetting());
  }

  async notNow(): Promise<ReminderTiming> {
    return known(await this.api.skipExactAlarms());
  }
}
