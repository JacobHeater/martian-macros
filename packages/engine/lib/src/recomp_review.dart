import 'package:mm_domain/mm_domain.dart';

import 'measured_change.dart';
import 'recomp_measure.dart';
import 'recomp_verdict.dart';

/// A review of a stretch on recomp (MM-133): a verdict with what it rests
/// on, or what would have to be logged to give one. It is the direction of
/// travel, not a measurement of fat or muscle, and it changes nothing by
/// itself.
final class RecompReview {
  const RecompReview({
    required this.week,
    required this.periodDays,
    required this.verdict,
    required this.missing,
    required this.waistMeasurements,
    this.waist,
    this.waistChangeCm,
    this.strength,
    this.liftsUp = const [],
    this.liftsDown = const [],
    this.weightChangeFraction,
    this.nextGoal,
  });

  /// Which review this is: 8, 12, then every 8 weeks.
  final int week;

  /// How many days up to today it looks at.
  final int periodDays;

  /// Null when [missing] is not empty.
  final RecompVerdict? verdict;

  /// What was not logged enough to give a verdict.
  final List<RecompMeasure> missing;

  final int waistMeasurements;
  final MeasuredChange? waist;
  final double? waistChangeCm;

  /// Up, down, or held or mixed.
  final MeasuredChange? strength;
  final List<String> liftsUp;
  final List<String> liftsDown;

  /// Trend weight's change over the period as a fraction of where it began.
  final double? weightChangeFraction;

  /// The goal to consider instead, for [RecompVerdict.notWorking] and
  /// [RecompVerdict.slowCut]. Null when body fat and training point at
  /// recomp all the same, where the thing to look at is the training.
  final GoalMode? nextGoal;
}
