import 'package:mm_domain/mm_domain.dart';

import 'coach_constants.dart';
import 'monthly_report.dart';
import 'report_estimate.dart';
import 'report_estimate_gap.dart';
import 'report_period.dart';
import 'report_target_change.dart';
import 'targets_record.dart';
import 'tdee_status.dart';
import 'usable_intake_days.dart';
import 'weight_trend_point.dart';

/// The report for [period] (MM-33), from stored history.
///
/// With fewer whole days of food than the coach needs to start measuring
/// ([calibrationDays]) the report says the expenditure estimate could not be
/// measured, and why, instead of showing a number.
MonthlyReport buildMonthlyReport({
  required ReportPeriod period,
  required List<IntakeDay> intake,
  required List<WeightObservation> weights,
  required List<WaistObservation> waist,
  required List<TargetsRecord> history,
  required List<WeightTrendPoint> trend,
}) {
  bool inPeriod(CalendarDate d) =>
      !d.isBefore(period.from) && !d.isAfter(period.to);

  final logged = [
    for (final d in intake)
      if (inPeriod(d.date) && d.kcal > 0) d,
  ];
  final whole = usableIntakeDays(logged);
  final weighIns = weights.where((w) => inPeriod(w.date)).length;

  final sorted = [...history]
    ..sort((a, b) => a.effectiveFrom.compareTo(b.effectiveFrom));
  TargetsRecord? inForceOn(CalendarDate day) {
    TargetsRecord? found;
    for (final r in sorted) {
      if (r.effectiveFrom.isAfter(day)) break;
      found = r;
    }
    return found;
  }

  // Trend change: from the first point of the month to the last.
  final points = [
    for (final p in trend)
      if (inPeriod(p.date)) p,
  ];
  final trendChange = weighIns >= 4 && points.length >= 2
      ? points.last.levelKg - points.first.levelKg
      : null;

  // What the targets in force meant for the month.
  var rateSum = 0.0, rateDays = 0;
  for (var i = 0; i < ReportPeriod.days; i++) {
    final record = inForceOn(period.from.addDays(i));
    if (record != null) {
      rateSum += record.targets.weeklyRateFraction;
      rateDays++;
    }
  }
  final intended = rateDays == 0 || points.isEmpty
      ? null
      : rateSum / rateDays * points.last.levelKg * ReportPeriod.days / 7;

  double? averageProtein;
  double? averageProteinTarget;
  if (whole.isNotEmpty) {
    averageProtein = whole.fold(0.0, (s, d) => s + d.proteinG) / whole.length;
    var targetSum = 0.0, targetDays = 0;
    for (final d in whole) {
      final record = inForceOn(d.date);
      if (record != null) {
        targetSum += record.targets.proteinG;
        targetDays++;
      }
    }
    if (targetDays > 0) averageProteinTarget = targetSum / targetDays;
  }

  final waists = [
    for (final w in waist)
      if (inPeriod(w.date)) w,
  ]..sort((a, b) => a.date.compareTo(b.date));

  final inMonth = [
    for (final r in sorted)
      if (inPeriod(r.effectiveFrom)) r,
  ];

  ReportEstimate? estimate;
  ReportEstimateGap? gap;
  if (whole.length < calibrationDays) {
    gap = ReportEstimateGap.tooFewFoodDays;
  } else {
    final settled = inMonth
        .where((r) => r.tdeeStatus == TdeeStatus.updated)
        .lastOrNull;
    if (settled == null) {
      gap = ReportEstimateGap.notSettled;
    } else {
      estimate = ReportEstimate(
        kcal: settled.tdeeKcal,
        sigmaKcal: settled.tdeeSigmaKcal,
      );
    }
  }

  return MonthlyReport(
    period: period,
    daysLogged: logged.length,
    completeDays: whole.length,
    weighIns: weighIns,
    trendChangeKg: trendChange,
    intendedChangeKg: intended,
    averageProteinG: averageProtein,
    averageProteinTargetG: averageProteinTarget,
    waistFromCm: waists.length >= 2 ? waists.first.waistCm : null,
    waistToCm: waists.length >= 2 ? waists.last.waistCm : null,
    estimate: estimate,
    estimateGap: gap,
    targetChanges: [
      for (final r in inMonth)
        if (r.explanation != null)
          ReportTargetChange(
            date: r.effectiveFrom,
            previousKcal: r.explanation!.previousKcal,
            newKcal: r.targets.kcal,
            tdeeKcal: r.tdeeKcal,
            tdeeSigmaKcal: r.tdeeSigmaKcal,
            tdeeStatus: r.tdeeStatus,
            lines: r.explanation!.lines,
          ),
    ],
  );
}
