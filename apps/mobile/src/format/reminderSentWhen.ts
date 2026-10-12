import type { ReminderKind } from '../domain';

const texts: Readonly<Record<ReminderKind, string>> = {
  weighIn: 'On days with no weigh-in yet.',
  logFood: 'On days with nothing logged yet.',
  weeklyMeasurement: 'On Sundays, when your waist has not been measured that week.',
};

/** When it is sent, for Settings. */
export const reminderSentWhen = (kind: ReminderKind): string => texts[kind];
