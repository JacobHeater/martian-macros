import type { PlannedReminder } from '../domain/PlannedReminder';
import type { ReminderKind } from '../domain/ReminderKind';
import type { ReminderScheduler } from '../domain/integration/ReminderScheduler';
import type { MmRemindersApi } from './MmRemindersApi';

/**
 * `ReminderScheduler` over the native plugin (MM-146). The prompt is the
 * whole notification: no weight, calories, target or streak ever appears
 * on a lock screen. A reminder's time is the local wall clock's, handed
 * over as an instant.
 */
export class NativeReminderScheduler implements ReminderScheduler {
  private readonly api: MmRemindersApi;
  private readonly prompt: (kind: ReminderKind) => string;

  constructor({ api, prompt }: { api: MmRemindersApi; prompt: (kind: ReminderKind) => string }) {
    this.api = api;
    this.prompt = prompt;
  }

  async requestPermission(): Promise<boolean> {
    return (await this.api.requestPermission()).granted;
  }

  replaceAll(reminders: readonly PlannedReminder[]): Promise<void> {
    return this.api.replaceAll({
      reminders: reminders.map((reminder) => ({
        title: this.prompt(reminder.kind),
        atMs: new Date(
          reminder.date.year,
          reminder.date.month - 1,
          reminder.date.day,
          Math.floor(reminder.minuteOfDay / 60),
          reminder.minuteOfDay % 60,
        ).getTime(),
      })),
    });
  }
}
