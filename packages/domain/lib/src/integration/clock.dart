import '../calendar_date.dart';

/// The current time. Everything that depends on "today" asks a clock, so a
/// test or a demo can fix the day.
abstract interface class Clock {
  /// The user's current calendar day.
  CalendarDate today();

  DateTime now();
}
