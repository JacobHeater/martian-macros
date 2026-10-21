import type { CalendarDate } from '../domain/CalendarDate';
import type { PlannedReminder } from '../domain/PlannedReminder';
import type { ReminderKind } from '../domain/ReminderKind';
import type { ReminderSetting } from '../domain/ReminderSetting';
import type { ReminderFacts } from './ReminderFacts';
import { reminderIgnoredStreak } from './reminderIgnoredStreak';
import { ReminderRule } from './ReminderRule';

const keepFirst: readonly ReminderKind[] = ['weeklyMeasurement', 'weighIn', 'logFood'];

/**
 * Every reminder to schedule from `minuteNow` on `today` (MM-146), oldest
 * first. The app replaces what the device has scheduled with this list each
 * time it is opened or something changes.
 *
 * - Only what is turned on, on the days it falls, outside the quiet period
 *   and outside a pause.
 * - Not on a day the thing is already done for, nor today once the time
 *   has passed.
 * - Each reminder is planned only as far as its ignored limit. So a user who
 *   stops opening the app hears `ReminderRule.ignoredLimit` more times and
 *   then nothing: nothing is ever sent because they are away.
 * - At most `ReminderRule.dailyCap` a day. The weekly one is kept first,
 *   because a daily one comes round again tomorrow.
 * - At most `mostPending` in all, the soonest, since iOS keeps no more than
 *   64 pending and drops the rest unsaid (MM-405). The plan is replaced
 *   each time the app opens, so the later ones are planned then.
 */
export function planReminders({
  settings,
  facts,
  today,
  minuteNow,
  mostPending = ReminderRule.mostPending,
}: {
  settings: readonly ReminderSetting[];
  facts: ReminderFacts;
  today: CalendarDate;
  minuteNow: number;
  /** Given only by tests; `ReminderRule.mostPending` otherwise. */
  mostPending?: number;
}): PlannedReminder[] {
  const planned: PlannedReminder[] = [];
  for (const setting of settings) {
    if (!setting.enabled) continue;
    let budget = ReminderRule.ignoredLimit - reminderIgnoredStreak({ setting, facts, today, minuteNow });
    for (let i = 0; i <= ReminderRule.horizonDays && budget > 0; i++) {
      const day = today.addDays(i);
      if (!facts.sendable(setting.kind, day, setting.minuteOfDay)) continue;
      // Already done as far as is known now: a weigh-in today, or a waist
      // measurement that still counts on that Sunday.
      if (facts.done(setting.kind, day)) continue;
      if (i === 0 && minuteNow >= setting.minuteOfDay) continue;
      planned.push({ kind: setting.kind, date: day, minuteOfDay: setting.minuteOfDay });
      budget--;
    }
  }

  const byDay = new Map<number, PlannedReminder[]>();
  for (const reminder of planned) {
    const day = byDay.get(reminder.date.epochDay);
    if (day === undefined) {
      byDay.set(reminder.date.epochDay, [reminder]);
    } else {
      day.push(reminder);
    }
  }
  const capped: PlannedReminder[] = [];
  for (const day of byDay.values()) {
    day.sort((a, b) => keepFirst.indexOf(a.kind) - keepFirst.indexOf(b.kind));
    capped.push(...day.slice(0, ReminderRule.dailyCap));
  }
  return capped
    .sort((a, b) => {
      const byDate = a.date.compareTo(b.date);
      return byDate !== 0 ? byDate : a.minuteOfDay - b.minuteOfDay;
    })
    .slice(0, mostPending);
}
