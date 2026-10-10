import 'dart:math' as math;

import 'package:mm_domain/mm_domain.dart';

import 'coach_snapshot.dart';
import 'confidence_level.dart';
import 'intake_standing.dart';
import 'safety_bounds.dart';
import 'stall_assessment.dart';
import 'stall_diagnosis.dart';
import 'stall_not_assessed_reason.dart';
import 'stall_rule.dart';
import 'stall_status.dart';
import 'summarize_adherence.dart';
import 'target_flag.dart';
import 'targets_record.dart';
import 'weight_event_effects.dart';

/// Whether progress has stalled against the goal and, if so, which kind of
/// stall it is (MM-140).
///
/// A stall is defined against the goal, not against zero: over the window the
/// trend moved less than a third of the intended pace, and the shortfall is
/// larger than the slope's own uncertainty. The diagnosis is the first that
/// applies of: thin data, masked by water, intake off target, and the
/// estimate being wrong. Nothing here changes a target.
StallAssessment assessStall({
  required UserSetup setup,
  required CoachSnapshot snapshot,
  required List<TargetsRecord> history,
  required List<IntakeDay> intake,
  required List<WeightObservation> weights,
  required CalendarDate today,
  List<WaistObservation> waist = const [],
  List<WeightEvent> weightEvents = const [],
  bool hasCycleData = false,
}) {
  final window = setup.profile.sex == BiologicalSex.female && !hasCycleData
      ? StallRule.windowDaysWithoutCycleData
      : StallRule.windowDays;
  StallAssessment skip(StallNotAssessedReason reason) =>
      StallAssessment.notAssessed(reason, windowDays: window);

  if (history.isEmpty) return skip(StallNotAssessedReason.noPaceToMeet);
  final current = history.last;
  final rate = current.targets.weeklyRateFraction;
  if (rate == 0) return skip(StallNotAssessedReason.noPaceToMeet);
  final gaining = rate > 0;

  // The phase began with the first of the trailing targets that share this
  // direction, or on the first day back from a long gap.
  var phaseStart = current.effectiveFrom;
  for (final record in history.reversed) {
    if (record.targets.weeklyRateFraction.sign != rate.sign) break;
    phaseStart = record.effectiveFrom;
  }
  final restart = snapshot.deficitRestartOn;
  if (restart != null && restart.isAfter(phaseStart)) phaseStart = restart;
  if (phaseStart.daysUntil(today) < window) {
    return skip(StallNotAssessedReason.earlyInPhase);
  }
  if (snapshot.confidence.level == ConfidenceLevel.learning) {
    return skip(StallNotAssessedReason.lowConfidence);
  }
  final lasting = snapshot.lastCreatineEventOn;
  if (lasting != null &&
      !lasting.isAfter(today) &&
      lasting.daysUntil(today) < StallRule.lastingEventDays) {
    return skip(StallNotAssessedReason.recentLastingEvent);
  }

  final through = today.addDays(-1);
  final from = through.addDays(-window);
  final points = {for (final p in snapshot.trend) p.date: p};
  final start = points[from];
  final end = points[through];
  if (start == null || end == null) {
    return skip(StallNotAssessedReason.notEnoughTrend);
  }
  final slopePerDay = (end.levelKg - start.levelKg) / window;
  final slopeSigma =
      math.sqrt(start.levelVariance + end.levelVariance) / window;
  final intendedPerDay = rate * snapshot.trendWeightKg / 7;
  // In the direction of the goal, how much of the intended pace was made.
  final progress = slopePerDay * rate.sign;
  final intended = intendedPerDay.abs();
  final stalled =
      progress < intended * StallRule.paceFraction &&
      intended - progress > slopeSigma;

  final summary = summarizeAdherence(
    through: through,
    intake: intake,
    weights: weights,
    history: history,
    floorKcal: snapshot.calorieFloorKcal,
    days: window,
  );
  if (!stalled) {
    return StallAssessment(
      status: StallStatus.noStall,
      windowDays: window,
      gaining: gaining,
      usableFoodDays: summary.completeDays,
      weighIns: summary.weighIns,
      slopeKgPerWeek: slopePerDay * 7,
      intendedKgPerWeek: intendedPerDay * 7,
    );
  }

  final inWindow = [
    for (final w in waist)
      if (w.date.isAfter(from) && !w.date.isAfter(through)) w,
  ]..sort((a, b) => a.date.compareTo(b.date));
  final waistChange = inWindow.length < StallRule.minimumWaistReadings
      ? null
      : inWindow.last.waistCm - inWindow.first.waistCm;
  final maskedByEvent = effectiveWeightEvents(weightEvents).any(
    (e) =>
        !e.date.isAfter(today) &&
        e.date.daysUntil(today) <= StallRule.maskingEventDays,
  );

  final StallDiagnosis diagnosis;
  if (summary.completeDays < StallRule.minimumFoodDays ||
      summary.weighIns < StallRule.minimumWeighIns) {
    diagnosis = StallDiagnosis.data;
  } else if (maskedByEvent ||
      (!gaining &&
          waistChange != null &&
          waistChange < -StallRule.waistNoiseCm)) {
    diagnosis = StallDiagnosis.masked;
  } else if (summary.standing ==
      (gaining ? IntakeStanding.below : IntakeStanding.above)) {
    diagnosis = StallDiagnosis.intake;
  } else {
    diagnosis = StallDiagnosis.estimate;
  }

  final atFloor =
      !gaining &&
      (current.targets.flags.contains(TargetFlag.flooredAtSafetyMinimum) ||
          current.targets.kcal <= snapshot.calorieFloorKcal + 1);
  double? expectedChange;
  if (diagnosis == StallDiagnosis.estimate && !atFloor) {
    final step = SafetyBounds.maxWeeklyTargetChange(current.targets.kcal);
    final shift = (snapshot.tdee.kcal - current.tdeeKcal).clamp(-step, step);
    final towardGoal = gaining ? shift > 0 : shift < 0;
    if (towardGoal) {
      expectedChange = gaining
          ? shift
          : math.max(shift, snapshot.calorieFloorKcal - current.targets.kcal);
    }
  }

  return StallAssessment(
    status: StallStatus.stalled,
    windowDays: window,
    diagnosis: diagnosis,
    gaining: gaining,
    usableFoodDays: summary.completeDays,
    weighIns: summary.weighIns,
    slopeKgPerWeek: slopePerDay * 7,
    intendedKgPerWeek: intendedPerDay * 7,
    averageIntakeKcal: summary.averageIntakeKcal,
    averageTargetKcal: summary.averageTargetKcal,
    waistChangeCm: waistChange,
    maskedByEvent: maskedByEvent,
    expectedChangeKcal: expectedChange,
    atFloor: atFloor,
    estimateLow:
        diagnosis == StallDiagnosis.estimate &&
        !gaining &&
        snapshot.tdee.kcal <
            StallRule.lowEstimateRestingMultiple * snapshot.bmrKcal,
  );
}
