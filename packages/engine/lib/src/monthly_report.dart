import 'report_estimate.dart';
import 'report_estimate_gap.dart';
import 'report_period.dart';
import 'report_target_change.dart';

/// A month of the user's work and what the coach measured from it (MM-33),
/// built from stored history. Facts, never a score.
final class MonthlyReport {
  const MonthlyReport({
    required this.period,
    required this.daysLogged,
    required this.completeDays,
    required this.weighIns,
    required this.targetChanges,
    this.trendChangeKg,
    this.intendedChangeKg,
    this.averageProteinG,
    this.averageProteinTargetG,
    this.waistFromCm,
    this.waistToCm,
    this.estimate,
    this.estimateGap,
  });

  final ReportPeriod period;

  /// Days with any food logged, and of those the whole days (the same rule
  /// as the adherence summary).
  final int daysLogged;
  final int completeDays;
  final int weighIns;

  /// Change in trend weight across the month; null with fewer than four
  /// weigh-ins, which cannot say.
  final double? trendChangeKg;

  /// What the targets in force meant for the month; null with none.
  final double? intendedChangeKg;

  /// Mean protein on whole days, and the mean protein target; null when
  /// there are no whole days or no targets.
  final double? averageProteinG;
  final double? averageProteinTargetG;

  /// First and last waist measurement of the month; null with fewer than two.
  final double? waistFromCm;
  final double? waistToCm;

  /// The expenditure estimate the month ended on, or null with [estimateGap]
  /// saying why.
  final ReportEstimate? estimate;
  final ReportEstimateGap? estimateGap;

  /// Every change to the targets in the month, oldest first.
  final List<ReportTargetChange> targetChanges;
}
