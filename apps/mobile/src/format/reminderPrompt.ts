import type { ReminderKind } from '../domain';

const prompts: Readonly<Record<ReminderKind, string>> = {
  weighIn: 'Morning weigh-in?',
  logFood: 'Log today’s food?',
  weeklyMeasurement: 'Time for this week’s measurement?',
  recoveryCheckIn: 'Five quick questions on the week?',
};

/**
 * The whole text of the notification (MM-146). A plain prompt: never a
 * figure, a streak, a count of missed days or a statement about the user.
 */
export const reminderPrompt = (kind: ReminderKind): string => prompts[kind];
