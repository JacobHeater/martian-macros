import 'calendar_date.dart';

/// Waist circumference at the navel on one day (MM-21, MM-155).
final class WaistObservation {
  const WaistObservation({
    required this.date,
    required this.waistCm,
    this.readings = const [],
  });

  /// No adult waist is outside these; a value that is was mistyped, or is
  /// in the wrong unit.
  static const minCm = 30.0;
  static const maxCm = 300.0;

  final CalendarDate date;

  /// The measurement: the middle of [readings] when there are three.
  final double waistCm;

  /// The readings as taken, in the order entered: three, or one for a
  /// quick entry. Empty for an entry made before readings were kept, which
  /// the card asked to be the middle of three.
  final List<double> readings;

  /// Whether this is one reading, which is noisier than the middle of
  /// three.
  bool get isSingleReading => readings.length == 1;

  @override
  bool operator ==(Object other) =>
      other is WaistObservation &&
      other.date == date &&
      other.waistCm == waistCm &&
      other.readings.length == readings.length &&
      [
        for (var i = 0; i < readings.length; i++)
          readings[i] == other.readings[i],
      ].every((same) => same);

  @override
  int get hashCode => Object.hash(date, waistCm, Object.hashAll(readings));
}
