import '../calendar_date.dart';
import '../day_completeness.dart';

/// Reads whether a day's log was marked complete or partial.
abstract interface class DayMarkReader {
  /// The mark for [date] ([DayCompleteness.unmarked] if none), then each change.
  Stream<DayCompleteness> watchCompleteness(CalendarDate date);
}
