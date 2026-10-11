import 'package:mm_domain/mm_domain.dart';

import 'recomp_part.dart';
import 'recomp_signal.dart';
import 'strength_trend.dart';
import 'weight_trend_point.dart';

/// Reads the last four weeks up to [today] for a recomp signal (MM-32).
/// Every threshold is a judgment about how noisy the measurement is, not a
/// validated figure, and each part needs enough logged to be judged at
/// all; otherwise it is unknown, not failed. Nothing is remembered between
/// calls: when a part stops holding, the signal goes.
///
/// - **Weight is flat** when the trend moved less than 0.5% in 28 days.
///   Needs weigh-ins on 8 of those days, 2 in the last 7, and 2 within 3
///   days of the day 28 days ago.
/// - **Waist is down** when the middle value of the entries of the last 14
///   days is at least 1.5 cm under that of the entries from 21 to 35 days
///   ago: 2 cm when either is a single entry, since one reading of a tape
///   is that noisy. Needs an entry in each and three in all. This stands
///   in for the shared change function of MM-155 until that exists.
/// - **Strength is up** when at least two lifts rose and more rose than
///   fell. A lift rose when its smoothed estimated max is up 2.5% or more
///   over 28 days, it was trained in the last 14, and it has four sessions
///   in the last 42; one more rep is about 3% of a max, so less than that
///   is not a change. Needs two lifts that can be judged.
RecompSignal recompSignalOf({
  required List<WeightTrendPoint> trend,
  required Iterable<WeightObservation> weights,
  required Iterable<WaistObservation> waist,
  required Iterable<StrengthTrend> strengthTrends,
  required CalendarDate today,
}) {
  int ago(CalendarDate date) => date.daysUntil(today);

  // Weight.
  var weightPart = RecompPart.unknown;
  double? trendWeightKg;
  final weighedAgo = {
    for (final w in weights)
      if (ago(w.date) >= 0) ago(w.date),
  };
  final enoughWeighIns =
      weighedAgo.where((d) => d < 28).length >= 8 &&
      weighedAgo.where((d) => d < 7).length >= 2 &&
      weighedAgo.where((d) => d >= 25 && d <= 31).length >= 2;
  WeightTrendPoint? at(int daysAgo) {
    for (final point in trend) {
      if (ago(point.date) == daysAgo) return point;
    }
    return null;
  }

  final now = at(0);
  final then = at(28);
  if (now != null) trendWeightKg = now.levelKg;
  if (enoughWeighIns && now != null && then != null && then.levelKg > 0) {
    final moved = (now.levelKg - then.levelKg).abs() / then.levelKg;
    weightPart = moved < 0.005 ? RecompPart.holds : RecompPart.doesNotHold;
  }

  // Waist.
  var waistPart = RecompPart.unknown;
  double? waistChangeCm;
  double? middle(List<double> values) {
    if (values.isEmpty) return null;
    final sorted = [...values]..sort();
    final mid = sorted.length ~/ 2;
    return sorted.length.isOdd
        ? sorted[mid]
        : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  final recent = [
    for (final w in waist)
      if (ago(w.date) >= 0 && ago(w.date) <= 13) w.waistCm,
  ];
  final baseline = [
    for (final w in waist)
      if (ago(w.date) >= 21 && ago(w.date) <= 35) w.waistCm,
  ];
  final recentMiddle = middle(recent);
  final baselineMiddle = middle(baseline);
  if (recentMiddle != null &&
      baselineMiddle != null &&
      recent.length + baseline.length >= 3) {
    final change = recentMiddle - baselineMiddle;
    waistChangeCm = change;
    final needed = recent.length == 1 || baseline.length == 1 ? 2.0 : 1.5;
    waistPart = change <= -needed ? RecompPart.holds : RecompPart.doesNotHold;
  }

  // Strength.
  var strengthPart = RecompPart.unknown;
  final liftsUp = <String>[];
  var judged = 0;
  var down = 0;
  for (final lift in strengthTrends) {
    final points = [
      for (final point in lift.points)
        if (ago(point.date) >= 0) point,
    ];
    if (points.isEmpty || ago(points.last.date) > 14) continue;
    if (points.where((p) => ago(p.date) < 42).length < 4) continue;
    final change = lift.changeOverDays(28);
    if (change == null) continue;
    final from = lift.points.last.trendKg - change;
    if (from <= 0) continue;
    judged++;
    final fraction = change / from;
    if (fraction >= 0.025) liftsUp.add(lift.name);
    if (fraction <= -0.025) down++;
  }
  if (judged >= 2) {
    strengthPart = liftsUp.length >= 2 && liftsUp.length > down
        ? RecompPart.holds
        : RecompPart.doesNotHold;
  }

  return RecompSignal(
    weight: weightPart,
    waist: waistPart,
    strength: strengthPart,
    trendWeightKg: trendWeightKg,
    waistChangeCm: waistChangeCm,
    liftsUp: List.unmodifiable(liftsUp),
  );
}
