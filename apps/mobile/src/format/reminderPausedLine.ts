import type { ReminderKind } from '../domain';

const lines: Readonly<Record<ReminderKind, string>> = {
  weighIn: 'Weigh-in reminders are paused.',
  logFood: 'Food reminders are paused.',
  weeklyMeasurement: 'Measurement reminders are paused.',
};

/** The line shown when it has paused itself. */
export const reminderPausedLine = (kind: ReminderKind): string => lines[kind];
