import 'package:mm_domain/mm_domain.dart';

import 'coach_constants.dart';
import 'coach_snapshot.dart';
import 'compute_targets.dart';
import 'consecutive_deficit_weeks.dart';
import 'daily_targets.dart';
import 'loss_safety_raise.dart';
import 'target_inputs.dart';
import 'targets_record.dart';
import 'tdee_status.dart';

/// Decides whether targets change today. Returns the new record, or null to
/// keep the current ones.
///
/// - First run: initial targets from the formula prior.
/// - Mode change: immediate, with no step limit (a cut-to-maintenance
///   switch must not be throttled).
/// - Otherwise at most every [checkInIntervalDays]. Adaptive changes wait
///   out the calibration period and a holding estimator; a raise for a
///   too-fast loss (MM-115) does not.
TargetsRecord? nextTargets({
  required UserSetup setup,
  required CoachSnapshot snapshot,
  required List<TargetsRecord> history,
  required CalendarDate today,
}) {
  if (snapshot.policy.blocked) return null;

  TargetsRecord build({
    DailyTargets? previous,
    int deficitWeeks = 0,
    double safetyRaiseKcal = 0,
  }) => TargetsRecord(
    effectiveFrom: today,
    mode: setup.goalMode,
    tdeeKcal: snapshot.tdee.kcal,
    tdeeSigmaKcal: snapshot.tdee.sigmaKcal,
    tdeeStatus: snapshot.tdee.status,
    targets: computeTargets(
      TargetInputs(
        sex: setup.profile.sex,
        heightCm: setup.profile.heightCm,
        trendWeightKg: snapshot.trendWeightKg,
        bodyFat: snapshot.bodyFat,
        mode: setup.goalMode,
        trainingStatus: setup.trainingStatus,
        policy: snapshot.policy,
        tdeeKcal: snapshot.tdee.kcal,
        bmrKcal: snapshot.bmrKcal,
        previous: previous,
        consecutiveDeficitWeeks: deficitWeeks,
        requestedLossFraction: setup.requestedLossFraction,
        safetyRaiseKcal: safetyRaiseKcal,
      ),
    ),
  );

  if (history.isEmpty) return build();
  final last = history.last;
  if (last.mode != setup.goalMode) return build();

  if (last.effectiveFrom.daysUntil(today) < checkInIntervalDays) return null;
  // Losing faster than the safe pace is not noise, so this runs through
  // calibration and while the estimate is held.
  final raise = lossSafetyRaiseKcal(
    trend: snapshot.trend,
    history: history,
    sex: setup.profile.sex,
    bodyFat: snapshot.bodyFat,
    resistanceTrained: setup.trainingStatus.isResistanceTrained,
  );
  if (raise > 0) {
    return build(
      previous: last.targets,
      deficitWeeks: consecutiveDeficitWeeks(history, today),
      safetyRaiseKcal: raise,
    );
  }

  if (setup.onboardedOn.daysUntil(today) < calibrationDays) return null;
  if (snapshot.tdee.status == TdeeStatus.held) return null;

  return build(
    previous: last.targets,
    deficitWeeks: consecutiveDeficitWeeks(history, today),
  );
}
