import 'package:mm_domain/mm_domain.dart';

import 'measured_change.dart';
import 'recomp_part.dart';
import 'recomp_signal.dart';
import 'strength_trend.dart';
import 'waist_change_of.dart';
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
/// - **Waist is down** when the shared change function says so over 28
///   days ([waistChangeOf], MM-155), from at least three entries in all.
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

  // Waist: the one answer every feature gets (MM-155).
  var waistPart = RecompPart.unknown;
  double? waistChangeCm;
  final waistChange = waistChangeOf(waist: waist, asOf: today);
  if (waistChange != null &&
      waistChange.recentEntries + waistChange.baselineEntries >= 3) {
    waistChangeCm = waistChange.changeCm;
    waistPart = waistChange.direction == MeasuredChange.down
        ? RecompPart.holds
        : RecompPart.doesNotHold;
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
