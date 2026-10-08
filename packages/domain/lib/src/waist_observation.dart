import 'calendar_date.dart';

/// Waist circumference at the navel; median of three readings.
final class WaistObservation {
  const WaistObservation({required this.date, required this.waistCm});

  final CalendarDate date;
  final double waistCm;
}
