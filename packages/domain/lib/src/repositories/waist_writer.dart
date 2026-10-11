import '../calendar_date.dart';

/// Writes waist measurements; one per calendar day.
abstract interface class WaistWriter {
  /// Sets the measurement for [date], replacing any existing one. With
  /// [readings], the one or three readings it was taken from are kept
  /// beside it (MM-155).
  Future<void> saveWaist(
    CalendarDate date,
    double waistCm, {
    List<double> readings = const [],
  });
}
