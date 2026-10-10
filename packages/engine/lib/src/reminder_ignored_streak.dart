import 'package:mm_domain/mm_domain.dart';

import 'reminder_facts.dart';

/// How many times running [setting]'s reminder has been sent with no
/// matching action, as of [minuteNow] on [today] (MM-146).
///
/// Nothing is recorded when a reminder fires: the count follows from the
/// days since the setting's `countFrom` on which it was due and the thing it
/// asks for was not done. Doing the thing resets it.
int reminderIgnoredStreak({
  required ReminderSetting setting,
  required ReminderFacts facts,
  required CalendarDate today,
  required int minuteNow,
}) {
  final from = setting.countFrom;
  if (!setting.enabled || from == null) return 0;
  if (facts.done(setting.kind, today)) return 0;
  var day = minuteNow >= setting.minuteOfDay ? today : today.addDays(-1);
  var streak = 0;
  while (!day.isBefore(from)) {
    if (facts.sendable(setting.kind, day, setting.minuteOfDay)) {
      if (facts.done(setting.kind, day)) break;
      streak++;
    }
    day = day.addDays(-1);
  }
  return streak;
}
