import type { ReminderScheduler } from '../domain/integration/ReminderScheduler';
import type { PlannedReminder } from '../domain/PlannedReminder';

/**
 * `ReminderScheduler` that shows nothing and remembers what it was asked to
 * schedule, for tests and demos.
 */
export class InMemoryReminderScheduler implements ReminderScheduler {
  /** What `requestPermission` answers. */
  grantPermission: boolean;

  /** How many times permission has been asked for. */
  permissionRequests = 0;

  /** What is scheduled now. */
  scheduled: readonly PlannedReminder[] = [];

  constructor({ grantPermission = true }: { grantPermission?: boolean } = {}) {
    this.grantPermission = grantPermission;
  }

  async requestPermission(): Promise<boolean> {
    this.permissionRequests++;
    return this.grantPermission;
  }

  async replaceAll(reminders: readonly PlannedReminder[]): Promise<void> {
    this.scheduled = Object.freeze([...reminders]);
  }
}
