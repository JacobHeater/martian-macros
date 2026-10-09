import 'daily_targets.dart';
import 'explanation_line.dart';
import 'explanation_reason.dart';
import 'target_flag.dart';
import 'targets_explanation.dart';
import 'targets_record.dart';

/// The causes of a change that the user may hold back once. Anything with a
/// safety reason, or a change the user made themselves, is not on the list.
const _holdable = {
  ExplanationReason.expenditureEstimate,
  ExplanationReason.paceAndWeight,
  ExplanationReason.stepLimit,
};

const _safetyFlags = {
  TargetFlag.raisedForSafePace,
  TargetFlag.heldAfterSafetyRaise,
  TargetFlag.underweightMaintenance,
  TargetFlag.modeNotAllowed,
  TargetFlag.dietBreak,
  TargetFlag.heldByUser,
};

/// Whether the user may keep last week's targets for now (MM-138): only on the
/// latest, ordinary reduction, and not twice running. Never for an increase,
/// a safety change, or a change they made themselves.
bool canHoldReduction(List<TargetsRecord> history) {
  if (history.length < 2) return false;
  final current = history.last;
  final previous = history[history.length - 2];
  final explanation = current.explanation;
  if (explanation == null || explanation.lines.isEmpty) return false;
  if (current.targets.kcal >= previous.targets.kcal - 0.5) return false;
  if (previous.targets.flags.contains(TargetFlag.heldByUser)) return false;
  if (current.targets.flags.any(_safetyFlags.contains)) return false;
  return explanation.lines.every((l) => _holdable.contains(l.reason));
}

/// The record that replaces the latest one when the user keeps last week's
/// targets: the same day, the previous week's numbers, flagged, and an
/// explanation whose lines still add up (to no change).
///
/// The next check-in starts from it as usual, so the reduction is deferred by
/// one check-in, not cancelled.
TargetsRecord holdReduction(List<TargetsRecord> history) {
  assert(canHoldReduction(history));
  final current = history.last;
  final previous = history[history.length - 2];
  final held = previous.targets;
  final explanation = current.explanation!;
  return TargetsRecord(
    effectiveFrom: current.effectiveFrom,
    mode: current.mode,
    tdeeKcal: current.tdeeKcal,
    tdeeSigmaKcal: current.tdeeSigmaKcal,
    tdeeStatus: current.tdeeStatus,
    safetyBodyFatPercent: current.safetyBodyFatPercent,
    profileRevision: current.profileRevision,
    targets: DailyTargets(
      kcal: held.kcal,
      proteinG: held.proteinG,
      proteinMinimumG: held.proteinMinimumG,
      fatG: held.fatG,
      carbsG: held.carbsG,
      weeklyRateFraction: held.weeklyRateFraction,
      flags: {TargetFlag.heldByUser},
    ),
    explanation: TargetsExplanation(
      lines: [
        ...explanation.lines,
        ExplanationLine(
          ExplanationReason.userHold,
          held.kcal - current.targets.kcal,
        ),
      ],
      previousKcal: held.kcal,
      newKcal: held.kcal,
      estimateStatus: explanation.estimateStatus,
      usableIntakeDays: explanation.usableIntakeDays,
      excludedPartialDays: explanation.excludedPartialDays,
      weighIns: explanation.weighIns,
    ),
  );
}
