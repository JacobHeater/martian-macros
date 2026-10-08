import 'calendar_date.dart';

/// One body-weight reading selected for its calendar day.
final class WeightObservation {
  const WeightObservation({
    required this.date,
    required this.weightKg,
    this.deviceId,
  });

  final CalendarDate date;
  final double weightKg;

  /// Platform source identifier (HealthKit source / Health Connect
  /// dataOrigin); null for manual entry.
  final String? deviceId;
}
