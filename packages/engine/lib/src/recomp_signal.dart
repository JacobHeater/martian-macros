import 'recomp_measure.dart';
import 'recomp_part.dart';

/// Whether the last four weeks look like a recomp from outside (MM-32):
/// trend weight flat, waist down, strength up. It reports a pattern in
/// what was logged. It does not measure fat or muscle.
final class RecompSignal {
  const RecompSignal({
    required this.weight,
    required this.waist,
    required this.strength,
    this.trendWeightKg,
    this.waistChangeCm,
    this.liftsUp = const [],
  });

  final RecompPart weight;
  final RecompPart waist;
  final RecompPart strength;

  /// Trend weight now, when it is known.
  final double? trendWeightKg;

  /// The change in waist over the four weeks, when both ends were measured;
  /// below zero is smaller.
  final double? waistChangeCm;

  /// The names of the lifts whose estimated max rose.
  final List<String> liftsUp;

  /// All three hold: the signal is there.
  bool get present =>
      weight == RecompPart.holds &&
      waist == RecompPart.holds &&
      strength == RecompPart.holds;

  /// The one measure not logged enough to judge, when the other two hold:
  /// logging it would show whether the signal is there. Null when the
  /// signal is present, when more than one is unknown, or when a part was
  /// measured and does not hold.
  RecompMeasure? get onlyMissing {
    final parts = {
      RecompMeasure.weight: weight,
      RecompMeasure.waist: waist,
      RecompMeasure.strength: strength,
    };
    if (parts.values.contains(RecompPart.doesNotHold)) return null;
    final unknown = [
      for (final entry in parts.entries)
        if (entry.value == RecompPart.unknown) entry.key,
    ];
    return unknown.length == 1 ? unknown.single : null;
  }
}
