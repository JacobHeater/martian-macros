import '../calendar_date.dart';
import '../day_completeness.dart';

/// Marks a day's log complete, partial or unmarked.
abstract interface class DayMarkWriter {
  Future<void> setCompleteness(CalendarDate date, DayCompleteness completeness);
}
