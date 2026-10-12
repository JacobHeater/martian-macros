import 'package:mm_domain/mm_domain.dart';

import 'measured_change.dart';
import 'mode_reason.dart';
import 'mode_recommendation.dart';
import 'recomp_measure.dart';
import 'recomp_review.dart';
import 'recomp_verdict.dart';
import 'strength_trend.dart';
import 'targets_record.dart';
import 'waist_change_of.dart';
import 'waist_rule.dart';
import 'weight_trend_point.dart';

/// The recomp review due on [today], or null when none is (MM-133).
///
/// A review falls due 8 and 12 weeks into an unbroken stretch on recomp,
/// then every 8 weeks, and stays for [shownForDays]. It reads the stretch
/// up to today, 12 weeks of it at most, and each signal against its own
/// noise. The figures are judgments, as in the recomp signal (MM-32):
///
/// - **Waist**: the shared change function over the period
///   ([waistChangeOf], MM-155). A verdict needs four entries in the period
///   and a measurement at each end.
/// - **Strength**: a lift rose or fell when its smoothed estimated max
///   moved 2.5% over the period. It counts when trained in the last 14
///   days and in six different weeks of the period; a verdict needs two.
///   Up is two lifts up and more up than down; down likewise; otherwise
///   held.
/// - **Weight**: the trend's change over the period.
///
/// The verdict is the first that applies: weight down more than 2% with
/// strength not down, a slow cut; waist down with strength not down,
/// working; no clear change in waist with strength up, probably working;
/// anything else, not working. At the 8 week review "not working" is "too
/// early to tell", unless the person is lean and trained, where the odds
/// were poor from the start and saying so early is kinder.
RecompReview? recompReviewOf({
  required List<TargetsRecord> history,
  required List<WeightTrendPoint> trend,
  required Iterable<WaistObservation> waist,
  required Iterable<StrengthTrend> strengthTrends,
  required ModeRecommendation recommendation,
  required CalendarDate today,
}) {
  const shownForDays = 14;
  int ago(CalendarDate date) => date.daysUntil(today);

  // The unbroken stretch on recomp that is still running.
  final records = [
    for (final record in history)
      if (!record.effectiveFrom.isAfter(today)) record,
  ]..sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom));
  if (records.isEmpty || records.last.mode != GoalMode.recomp) return null;
  var since = records.last.effectiveFrom;
  for (final record in records.reversed) {
    if (record.mode != GoalMode.recomp) break;
    since = record.effectiveFrom;
  }
  final days = ago(since);

  // The latest review reached: 8, 12, 20, 28... weeks.
  int? week;
  for (var w = 8; w * 7 <= days; w += w == 8 ? 4 : 8) {
    week = w;
  }
  if (week == null || days - week * 7 >= shownForDays) return null;
  final period = days > 84 ? 84 : days;

  // Waist: the one answer every feature gets (MM-155).
  final inPeriod = [
    for (final w in waist)
      if (ago(w.date) >= 0 &&
          ago(w.date) <= period + WaistRule.baselineWithinDays)
        w,
  ];
  final measured = inPeriod.length < 4
      ? null
      : waistChangeOf(waist: waist, asOf: today, days: period);
  final waistChange = measured?.direction;
  final waistChangeCm = measured?.changeCm;

  // Strength.
  final liftsUp = <String>[];
  final liftsDown = <String>[];
  var judged = 0;
  for (final lift in strengthTrends) {
    final points = [
      for (final point in lift.points)
        if (ago(point.date) >= 0 && ago(point.date) <= period) point,
    ];
    if (points.isEmpty || ago(points.last.date) > 14) continue;
    final weeks = {for (final point in points) ago(point.date) ~/ 7};
    if (weeks.length < 6) continue;
    final change = lift.changeOverDays(period - ago(points.last.date));
    if (change == null) continue;
    final from = lift.points.last.trendKg - change;
    if (from <= 0) continue;
    judged++;
    final fraction = change / from;
    if (fraction >= 0.025) liftsUp.add(lift.name);
    if (fraction <= -0.025) liftsDown.add(lift.name);
  }
  final strength = judged < 2
      ? null
      : liftsUp.length >= 2 && liftsUp.length > liftsDown.length
      ? MeasuredChange.up
      : liftsDown.length >= 2 && liftsDown.length > liftsUp.length
      ? MeasuredChange.down
      : MeasuredChange.noClearChange;

  // Weight.
  double? weightChange;
  WeightTrendPoint? at(int daysAgo) {
    for (final point in trend) {
      if (ago(point.date) == daysAgo) return point;
    }
    return null;
  }

  final now = at(0);
  final then = at(period);
  if (now != null && then != null && then.levelKg > 0) {
    weightChange = (now.levelKg - then.levelKg) / then.levelKg;
  }

  final missing = [
    if (weightChange == null) RecompMeasure.weight,
    if (waistChange == null) RecompMeasure.waist,
    if (strength == null) RecompMeasure.strength,
  ];

  RecompVerdict? verdict;
  if (missing.isEmpty) {
    final strengthHeld = strength != MeasuredChange.down;
    if (weightChange! < -0.02 && strengthHeld) {
      verdict = RecompVerdict.slowCut;
    } else if (waistChange == MeasuredChange.down && strengthHeld) {
      verdict = RecompVerdict.working;
    } else if (waistChange == MeasuredChange.noClearChange &&
        strength == MeasuredChange.up) {
      verdict = RecompVerdict.probablyWorking;
    } else {
      final leanAndTrained = recommendation.reason == ModeReason.leanAndTrained;
      verdict = week == 8 && !leanAndTrained
          ? RecompVerdict.tooEarly
          : RecompVerdict.notWorking;
    }
  }

  // A deficit is never suggested to someone it is not allowed for.
  final noDeficit =
      recommendation.reason == ModeReason.deficitNotAllowed ||
      recommendation.reason == ModeReason.underweight;
  final GoalMode? nextGoal = switch (verdict) {
    RecompVerdict.slowCut => noDeficit ? null : GoalMode.fatLoss,
    RecompVerdict.notWorking =>
      recommendation.mode == GoalMode.recomp ? null : recommendation.mode,
    _ => null,
  };

  return RecompReview(
    week: week,
    periodDays: period,
    verdict: verdict,
    missing: missing,
    waistMeasurements: inPeriod.length,
    waist: waistChange,
    waistChangeCm: waistChangeCm,
    strength: strength,
    liftsUp: List.unmodifiable(liftsUp),
    liftsDown: List.unmodifiable(liftsDown),
    weightChangeFraction: weightChange,
    nextGoal: nextGoal,
  );
}
