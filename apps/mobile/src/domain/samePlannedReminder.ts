import type { PlannedReminder } from './PlannedReminder';

/** Whether two planned reminders are the same one (MM-146). */
export function samePlannedReminder(a: PlannedReminder, b: PlannedReminder): boolean {
  return a.kind === b.kind && a.date === b.date && a.minuteOfDay === b.minuteOfDay;
}
