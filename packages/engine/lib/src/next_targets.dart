import 'package:mm_domain/mm_domain.dart';

import 'coach_constants.dart';
import 'coach_snapshot.dart';
import 'compute_targets.dart';
import 'consecutive_deficit_weeks.dart';
import 'daily_targets.dart';
import 'loss_safety_raise.dart';
import 'target_flag.dart';
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
  }) {
    final targets = computeTargets(
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
    );
    return TargetsRecord(
      effectiveFrom: today,
      // A deficit ended by low body weight is stored as the maintenance it
      // became; the app also moves the user's goal there, so it does not
      // resume by itself when weight recovers (MM-111).
      mode: targets.flags.contains(TargetFlag.underweightMaintenance)
          ? GoalMode.maintenance
          : setup.goalMode,
      tdeeKcal: snapshot.tdee.kcal,
      tdeeSigmaKcal: snapshot.tdee.sigmaKcal,
      tdeeStatus: snapshot.tdee.status,
      targets: targets,
    );
  }

  if (history.isEmpty) return build();
  final last = history.last;
  // A goal change applies at once. Not when the last record already holds the
  // user at maintenance because their weight is too low for the goal they
  // still have stored (the app then moves the goal itself, MM-111).
  final heldForLowWeight =
      last.targets.flags.contains(TargetFlag.underweightMaintenance) &&
      !snapshot.policy.allowedModes.contains(setup.goalMode);
  if (last.mode != setup.goalMode && !heldForLowWeight) return build();

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
  // A deficit the policy no longer allows (body weight has fallen into the
  // underweight range, MM-111) ends at this check-in, calibration or not.
  final deficitNoLongerAllowed =
      last.targets.weeklyRateFraction < 0 &&
      !snapshot.policy.allowedModes.contains(setup.goalMode);
  if (raise > 0 || deficitNoLongerAllowed) {
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
