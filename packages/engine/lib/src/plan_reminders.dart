import 'package:mm_domain/mm_domain.dart';

import 'reminder_facts.dart';
import 'reminder_ignored_streak.dart';
import 'reminder_rule.dart';

/// Every reminder to schedule from [minuteNow] on [today] (MM-146), oldest
/// first. The app replaces what the device has scheduled with this list each
/// time it is opened or something changes.
///
/// - Only what is turned on, on the days it falls, outside the quiet period
///   and outside a pause.
/// - Not on a day the thing is already done for, nor today once the time
///   has passed.
/// - Each reminder is planned only as far as its ignored limit. So a user who
///   stops opening the app hears [ReminderRule.ignoredLimit] more times and
///   then nothing: nothing is ever sent because they are away.
/// - At most [ReminderRule.dailyCap] a day. The weekly one is kept first,
///   because a daily one comes round again tomorrow.
List<PlannedReminder> planReminders({
  required List<ReminderSetting> settings,
  required ReminderFacts facts,
  required CalendarDate today,
  required int minuteNow,
}) {
  final planned = <PlannedReminder>[];
  for (final setting in settings) {
    if (!setting.enabled) continue;
    var budget =
        ReminderRule.ignoredLimit -
        reminderIgnoredStreak(
          setting: setting,
          facts: facts,
          today: today,
          minuteNow: minuteNow,
        );
    for (var i = 0; i <= ReminderRule.horizonDays && budget > 0; i++) {
      final day = today.addDays(i);
      if (!facts.sendable(setting.kind, day, setting.minuteOfDay)) continue;
      // Already done as far as is known now: a weigh-in today, or a waist
      // measurement that still counts on that Sunday.
      if (facts.done(setting.kind, day)) continue;
      if (i == 0 && minuteNow >= setting.minuteOfDay) continue;
      planned.add(
        PlannedReminder(
          kind: setting.kind,
          date: day,
          minuteOfDay: setting.minuteOfDay,
        ),
      );
      budget--;
    }
  }

  const keepFirst = [
    ReminderKind.weeklyMeasurement,
    ReminderKind.weighIn,
    ReminderKind.logFood,
  ];
  final byDay = <int, List<PlannedReminder>>{};
  for (final reminder in planned) {
    byDay.putIfAbsent(reminder.date.epochDay, () => []).add(reminder);
  }
  final capped = <PlannedReminder>[];
  for (final day in byDay.values) {
    day.sort(
      (a, b) => keepFirst.indexOf(a.kind).compareTo(keepFirst.indexOf(b.kind)),
    );
    capped.addAll(day.take(ReminderRule.dailyCap));
  }
  return capped..sort((a, b) {
    final byDate = a.date.compareTo(b.date);
    return byDate != 0 ? byDate : a.minuteOfDay.compareTo(b.minuteOfDay);
  });
}
