import 'package:mm_domain/mm_domain.dart';

import 'pause_on.dart';
import 'reminder_rule.dart';

/// What the reminder rules need to know about what the user has done
/// (MM-146).
final class ReminderFacts {
  ReminderFacts({
    Iterable<CalendarDate> weighInDays = const [],
    Iterable<CalendarDate> foodDays = const [],
    Iterable<CalendarDate> waistDays = const [],
    this.pauses = const [],
  }) : _weighIn = {for (final d in weighInDays) d.epochDay},
       _food = {for (final d in foodDays) d.epochDay},
       _waist = {for (final d in waistDays) d.epochDay};

  final Set<int> _weighIn;
  final Set<int> _food;
  final Set<int> _waist;
  final List<Pause> pauses;

  /// Whether the thing [kind] asks for has been done as of [day], so no
  /// reminder is wanted that day.
  bool done(ReminderKind kind, CalendarDate day) => switch (kind) {
    ReminderKind.weighIn => _weighIn.contains(day.epochDay),
    ReminderKind.logFood => _food.contains(day.epochDay),
    ReminderKind.weeklyMeasurement => _waist.any(
      (d) =>
          d <= day.epochDay &&
          d > day.epochDay - ReminderRule.measurementEveryDays,
    ),
  };

  /// Whether [kind] could be sent on [day] at [minuteOfDay] at all: a day it
  /// falls on, outside the quiet period, and not in a pause (MM-148).
  bool sendable(ReminderKind kind, CalendarDate day, int minuteOfDay) {
    if (ReminderRule.isQuiet(minuteOfDay)) return false;
    if (pauseOn(pauses, day) != null) return false;
    // The weekly measurement is asked for on Sundays. Day 0 was a Thursday.
    if (kind == ReminderKind.weeklyMeasurement && (day.epochDay + 4) % 7 != 0) {
      return false;
    }
    return true;
  }
}
