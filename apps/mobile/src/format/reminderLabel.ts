import type { ReminderKind } from '../domain';

const labels: Readonly<Record<ReminderKind, string>> = {
  weighIn: 'Weigh-in',
  logFood: 'Log food',
  weeklyMeasurement: 'Weekly measurement',
  recoveryCheckIn: 'How you are holding up',
};

/** The name of the reminder in Settings. */
export const reminderLabel = (kind: ReminderKind): string => labels[kind];
