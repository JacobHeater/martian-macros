import type { ReminderKind } from '../domain';
import { recoverySectionTitle } from './recoverySectionTitle';

const prompts: Readonly<Record<ReminderKind, string>> = {
  weighIn: 'Morning weigh-in?',
  logFood: 'Log today’s food?',
  weeklyMeasurement: 'Time for this week’s measurement?',
  // Named as the section on Coach is (MM-116), not by a count of questions that could drift from it.
  recoveryCheckIn: `Time for “${recoverySectionTitle}” on Coach?`,
};

/**
 * The whole text of the notification (MM-146). A plain prompt: never a
 * figure, a streak, a count of missed days or a statement about the user.
 * The recovery check-in's prompt quotes its section's title, the one place
 * "you" appears.
 */
export const reminderPrompt = (kind: ReminderKind): string => prompts[kind];
