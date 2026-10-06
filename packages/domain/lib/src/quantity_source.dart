import 'dart:math' as math;

/// How a logged quantity was measured. Every food entry carries one so the
/// engine knows how much to trust the day's intake total.
enum QuantitySource {
  weighed(0.05),
  labelServing(0.10),
  householdMeasure(0.15),
  palm(0.25),
  cuppedHand(0.30),
  thumb(0.40),
  quickAdd(0.20);

  const QuantitySource(this.relativeSigma);

  /// One-sigma relative error of the energy in an entry measured this way.
  final double relativeSigma;
}

/// Combines independent per-entry errors into a relative sigma for the day.
///
/// [entries] are (kcal, source) pairs. Returns 0 for an empty day.
double dailyRelativeSigma(
  Iterable<(double kcal, QuantitySource source)> entries,
) {
  var total = 0.0;
  var variance = 0.0;
  for (final (kcal, source) in entries) {
    total += kcal;
    final sd = kcal * source.relativeSigma;
    variance += sd * sd;
  }
  return total <= 0 ? 0 : math.sqrt(variance) / total;
}
