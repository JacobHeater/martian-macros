import type { ReminderScheduler } from '../domain/integration/ReminderScheduler';

/**
 * Where the phone's notifications cannot be reached: a browser, or a build
 * without the notifications plugin. Permission is never given, so no
 * reminder is ever turned on.
 */
export class NoNotifications implements ReminderScheduler {
  requestPermission(): Promise<boolean> {
    return Promise.resolve(false);
  }

  replaceAll(): Promise<void> {
    return Promise.resolve();
  }
}
