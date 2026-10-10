import 'package:mm_domain/mm_domain.dart';

import 'logging_streak.dart';
import 'pause_on.dart';
import 'streak_rule.dart';
import 'usable_intake_days.dart';

/// The logging streak as of [today] (MM-92).
///
/// A day counts when it is a whole day by the same rule the adherence summary
/// and the expenditure estimate use (`usableIntakeDays`), so the app never
/// rewards what it does not count elsewhere. Nothing about how much was
/// eaten, or whether it was under target, matters: a whole day is a whole
/// day.
///
/// - One missed day in any [StreakRule.forgiveWithinDays] is forgiven; a
///   second breaks the streak.
/// - A paused day (MM-148) neither counts nor breaks it.
/// - Today is not over: it counts when it is already whole and is never a
///   miss.
LoggingStreak loggingStreakOf({
  required CalendarDate today,
  required List<IntakeDay> intake,
  Iterable<Pause> pauses = const [],
}) {
  final whole = {
    for (final d in usableIntakeDays([
      for (final d in intake)
        if (d.kcal > 0 && !d.date.isAfter(today)) d,
    ]))
      d.date.epochDay,
  };
  if (whole.isEmpty) return const LoggingStreak(days: 0);
  final first = whole.reduce((a, b) => a < b ? a : b);
  final all = pauses.toList();

  var days = 0;
  int? lastMiss;
  int? forgiven;
  final start = whole.contains(today.epochDay)
      ? today.epochDay
      : today.epochDay - 1;
  for (var day = start; day >= first; day--) {
    if (pauseOn(all, CalendarDate.fromEpochDay(day)) != null) continue;
    if (whole.contains(day)) {
      days++;
      continue;
    }
    if (lastMiss != null && lastMiss - day < StreakRule.forgiveWithinDays) {
      break;
    }
    lastMiss = day;
    forgiven ??= day;
  }
  return LoggingStreak(
    days: days,
    forgivenOn: forgiven == null ? null : CalendarDate.fromEpochDay(forgiven),
  );
}
