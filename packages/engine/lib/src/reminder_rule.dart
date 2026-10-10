import 'package:mm_domain/mm_domain.dart';

/// The rules reminders obey (MM-146). Judgement: tune them here.
abstract final class ReminderRule {
  /// A reminder sent this many times running with no matching action stops.
  static const ignoredLimit = 7;

  /// The most notifications in one day, whatever is turned on.
  static const dailyCap = 2;

  /// Nothing is sent from [quietFromMinute] until [quietToMinute] the next
  /// morning (9 pm to 7 am).
  static const quietFromMinute = 21 * 60;
  static const quietToMinute = 7 * 60;

  /// The waist counts as measured for this many days.
  static const measurementEveryDays = 7;

  /// How far ahead reminders are planned. Long enough for seven weekly ones.
  static const horizonDays = 49;

  /// When each reminder is sent until the user chooses a time.
  static int defaultMinuteOfDay(ReminderKind kind) => switch (kind) {
    ReminderKind.weighIn => 7 * 60,
    ReminderKind.logFood => 20 * 60,
    ReminderKind.weeklyMeasurement => 8 * 60,
  };

  /// Whether [minuteOfDay] falls in the quiet period.
  static bool isQuiet(int minuteOfDay) =>
      minuteOfDay >= quietFromMinute || minuteOfDay < quietToMinute;
}
