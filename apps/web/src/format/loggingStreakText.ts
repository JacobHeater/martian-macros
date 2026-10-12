import { type LoggingStreak, StreakRule } from '../engine';

/**
 * The quiet line about the logging streak (MM-92), or undefined when there
 * is nothing to say. It counts the work and nothing else: never how much
 * was eaten, never weight, never "under target".
 */
export function loggingStreakText(streak: LoggingStreak): string | undefined {
  if (streak.days < StreakRule.showFromDays) return undefined;
  const base = `${streak.days} whole days logged in a row.`;
  return streak.forgivenOn === undefined ? base : `${base} A missed day is forgiven, once a week.`;
}
