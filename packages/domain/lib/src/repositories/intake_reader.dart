import '../calendar_date.dart';
import '../intake_day.dart';

/// Reads the intake the engine consumes, derived from the food log.
abstract interface class IntakeReader {
  /// One observation per day with any food logged, oldest first, from
  /// [since], then the full list after each change to the log or the marks.
  Stream<List<IntakeDay>> watchIntakeDays({required CalendarDate since});
}
