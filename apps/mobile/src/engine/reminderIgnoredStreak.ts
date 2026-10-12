import type { CalendarDate } from '../domain/CalendarDate';
import type { ReminderSetting } from '../domain/ReminderSetting';
import type { ReminderFacts } from './ReminderFacts';

/**
 * How many times running `setting`'s reminder has been sent with no
 * matching action, as of `minuteNow` on `today` (MM-146).
 *
 * Nothing is recorded when a reminder fires: the count follows from the
 * days since the setting's `countFrom` on which it was due and the thing it
 * asks for was not done. Doing the thing resets it.
 */
export function reminderIgnoredStreak({
  setting,
  facts,
  today,
  minuteNow,
}: {
  setting: ReminderSetting;
  facts: ReminderFacts;
  today: CalendarDate;
  minuteNow: number;
}): number {
  const from = setting.countFrom;
  if (!setting.enabled || from === undefined) return 0;
  if (facts.done(setting.kind, today)) return 0;
  let day = minuteNow >= setting.minuteOfDay ? today : today.addDays(-1);
  let streak = 0;
  while (!day.isBefore(from)) {
    if (facts.sendable(setting.kind, day, setting.minuteOfDay)) {
      if (facts.done(setting.kind, day)) break;
      streak++;
    }
    day = day.addDays(-1);
  }
  return streak;
}
