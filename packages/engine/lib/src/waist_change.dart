import 'measured_change.dart';

/// Whether the waist changed over a period, and the figures behind the
/// answer (MM-155). Every feature that asks gets this one answer.
final class WaistChange {
  const WaistChange({
    required this.direction,
    required this.fromCm,
    required this.toCm,
    required this.thresholdCm,
    required this.recentEntries,
    required this.baselineEntries,
  });

  /// Down, up, or no clear change: a result, not an absence.
  final MeasuredChange direction;

  /// The smoothed measurement at each end: the middle value of up to three
  /// entries.
  final double fromCm;
  final double toCm;

  /// What the difference had to exceed to be called a change.
  final double thresholdCm;

  /// How many entries each end was smoothed from.
  final int recentEntries;
  final int baselineEntries;

  /// Below zero is smaller.
  double get changeCm => toCm - fromCm;
}
