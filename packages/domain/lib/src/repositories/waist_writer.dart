import '../calendar_date.dart';

/// Writes waist measurements; one per calendar day.
abstract interface class WaistWriter {
  /// Sets the measurement for [date], replacing any existing one.
  Future<void> saveWaist(CalendarDate date, double waistCm);
}
