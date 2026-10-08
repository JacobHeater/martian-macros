import '../calendar_date.dart';

/// Writes weigh-ins; one per calendar day.
abstract interface class WeightWriter {
  /// Sets the weigh-in for [date], replacing any existing one.
  Future<void> saveWeight(CalendarDate date, double weightKg);

  /// Removes the weigh-in for [date]. Does nothing if there is none.
  Future<void> deleteWeight(CalendarDate date);
}
