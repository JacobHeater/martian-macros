import 'package:mm_domain/mm_domain.dart';

import 'coach_constants.dart';
import 'coach_snapshot.dart';
import 'compute_targets.dart';
import 'consecutive_deficit_weeks.dart';
import 'daily_targets.dart';
import 'explain_targets.dart';
import 'explanation_trigger.dart';
import 'loss_safety_raise.dart';
import 'safety_body_fat.dart';
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

  final lastSafetyBf = history.isEmpty
      ? null
      : history.last.safetyBodyFatPercent;
  final safetyBf = safetyBodyFatPercent(
    snapshot.bodyFat,
    previous: lastSafetyBf,
  );

  TargetsRecord build({
    DailyTargets? previous,
    int deficitWeeks = 0,
    double safetyRaiseKcal = 0,
    ExplanationTrigger trigger = ExplanationTrigger.checkIn,
  }) {
    final traced = computeTargetsTraced(
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
        safetyBodyFatPercent: safetyBf,
        safetyRaiseKcal: safetyRaiseKcal,
      ),
    );
    final targets = traced.targets;
    final forcedToMaintenance =
        targets.flags.contains(TargetFlag.underweightMaintenance) ||
        targets.flags.contains(TargetFlag.modeNotAllowed);
    return TargetsRecord(
      effectiveFrom: today,
      profileRevision: setup.profileRevision,
      // A goal the policy no longer allows (low body weight, MM-111; a health
      // check answer, MM-83) is stored as the maintenance it became; the app
      // also moves the user's goal there, so it does not resume by itself
      // when the reason goes away.
      mode: forcedToMaintenance ? GoalMode.maintenance : setup.goalMode,
      tdeeKcal: snapshot.tdee.kcal,
      tdeeSigmaKcal: snapshot.tdee.sigmaKcal,
      tdeeStatus: snapshot.tdee.status,
      safetyBodyFatPercent: safetyBf,
      targets: targets,
      explanation: explainTargets(
        trigger: targets.flags.contains(TargetFlag.underweightMaintenance)
            ? ExplanationTrigger.underweightRule
            : targets.flags.contains(TargetFlag.modeNotAllowed)
            ? ExplanationTrigger.healthRule
            : history.isEmpty
            ? ExplanationTrigger.firstTargets
            : trigger,
        previous: history.isEmpty ? null : history.last,
        targets: targets,
        trace: traced.trace,
        tdee: snapshot.tdee,
      ),
    );
  }

  if (history.isEmpty) return build();
  final last = history.last;
  // A goal change applies at once. Not when the last record already holds the
  // user at maintenance because their weight or health check rules out the
  // goal they still have stored (the app then moves the goal itself,
  // MM-111, MM-83).
  final heldAtMaintenance =
      (last.targets.flags.contains(TargetFlag.underweightMaintenance) ||
          last.targets.flags.contains(TargetFlag.modeNotAllowed)) &&
      !snapshot.policy.allowedModes.contains(setup.goalMode);
  if (last.mode != setup.goalMode && !heldAtMaintenance) {
    return build(trigger: ExplanationTrigger.goalChange);
  }

  // A corrected sex, date of birth, height or health check: the old targets
  // were made for someone else, so new ones start now, without the weekly
  // step limit (MM-83).
  if (setup.profileRevision != last.profileRevision) {
    return build(
      deficitWeeks: consecutiveDeficitWeeks(history, today),
      trigger: ExplanationTrigger.profileCorrection,
    );
  }

  // A body-fat estimate that has moved leaner, say because the user corrected
  // it in Settings, applies the stricter limits at once; one that moved
  // fatter waits for the check-in (MM-132).
  if (lastSafetyBf != null &&
      cautiousBodyFatPercent(snapshot.bodyFat) <
          lastSafetyBf - safetyBodyFatDeadbandPercent) {
    return build(
      previous: last.targets,
      deficitWeeks: consecutiveDeficitWeeks(history, today),
      trigger: ExplanationTrigger.bodyFatCorrection,
    );
  }

  if (last.effectiveFrom.daysUntil(today) < checkInIntervalDays) return null;
  // Losing faster than the safe pace is not noise, so this runs through
  // calibration and while the estimate is held.
  final raise = lossSafetyRaiseKcal(
    trend: snapshot.trend,
    history: history,
    sex: setup.profile.sex,
    bodyFat: snapshot.bodyFat,
    safetyBodyFatPercent: safetyBf,
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
