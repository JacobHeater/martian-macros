import 'coach_confidence.dart';
import 'daily_targets.dart';
import 'explanation_line.dart';
import 'explanation_reason.dart';
import 'explanation_trigger.dart';
import 'target_flag.dart';
import 'targets_explanation.dart';
import 'targets_record.dart';
import 'targets_trace.dart';
import 'tdee_estimate.dart';

/// Why [targets] differ from [previous], as contributions that add up to the
/// change in calories (MM-138).
///
/// The change is split in the order the calculation runs: the move in
/// expenditure, everything else in the ordinary formula, then each limit that
/// acted. Nothing is attributed to a day's eating: the engine estimates
/// expenditure, it does not react to intake.
TargetsExplanation explainTargets({
  required ExplanationTrigger trigger,
  required TargetsRecord? previous,
  required DailyTargets targets,
  required TargetsTrace trace,
  required TdeeEstimate tdee,
  CoachConfidence? confidence,
}) {
  final lines = <ExplanationLine>[];
  void add(ExplanationReason reason, double kcal, {double? from, double? to}) {
    if (kcal.abs() >= 0.5) {
      lines.add(ExplanationLine(reason, kcal, from: from, to: to));
    }
  }

  final base = previous?.targets.kcal;
  if (base == null) {
    lines.add(ExplanationLine(ExplanationReason.firstTargets, trace.finalKcal));
  } else {
    final expenditure = tdee.kcal - previous!.tdeeKcal;
    add(
      ExplanationReason.expenditureEstimate,
      expenditure,
      from: previous.tdeeKcal,
      to: tdee.kcal,
    );
    final rest = trace.formulaKcal - base - expenditure;
    add(
      targets.flags.contains(TargetFlag.dietBreak)
          ? ExplanationReason.dietBreak
          : switch (trigger) {
              ExplanationTrigger.goalChange => ExplanationReason.goalChange,
              ExplanationTrigger.profileCorrection =>
                ExplanationReason.profileCorrection,
              ExplanationTrigger.appRuleUpdate =>
                ExplanationReason.appRuleUpdate,
              ExplanationTrigger.healthRule => ExplanationReason.healthRule,
              ExplanationTrigger.underweightRule =>
                ExplanationReason.underweightRule,
              ExplanationTrigger.bodyFatCorrection =>
                ExplanationReason.bodyFatEstimate,
              _ => ExplanationReason.paceAndWeight,
            },
      rest,
    );
    add(ExplanationReason.stepLimit, trace.limitedKcal - trace.formulaKcal);
    add(ExplanationReason.holdAfterRaise, trace.heldKcal - trace.limitedKcal);
    add(ExplanationReason.safetyRaise, trace.raisedKcal - trace.heldKcal);
    add(
      ExplanationReason.calorieFloor,
      trace.finalKcal - trace.raisedKcal,
      from: trace.raisedKcal,
      to: trace.finalKcal,
    );
  }
  return TargetsExplanation(
    lines: lines,
    newKcal: trace.finalKcal,
    previousKcal: base,
    estimateStatus: tdee.status,
    usableIntakeDays: tdee.usableIntakeDays,
    excludedPartialDays: tdee.excludedPartialDays,
    weighIns: tdee.weighIns,
    confidence: confidence,
  );
}
