import { ArgumentError } from '../lang/ArgumentError';
import { canHoldReduction } from './canHoldReduction';
import { DailyTargets } from './DailyTargets';
import { ExplanationLine } from './ExplanationLine';
import type { TargetFlag } from './TargetFlag';
import { TargetsExplanation } from './TargetsExplanation';
import { TargetsRecord } from './TargetsRecord';

/**
 * The record that replaces the latest one when the user keeps last week's
 * targets: the same day, the previous week's numbers, flagged, and an
 * explanation whose lines still add up (to no change).
 *
 * The next check-in starts from it as usual, so the reduction is deferred by
 * one check-in, not cancelled.
 */
export function holdReduction(history: readonly TargetsRecord[]): TargetsRecord {
  const current = history[history.length - 1];
  const previous = history[history.length - 2];
  const explanation = current?.explanation;
  if (!canHoldReduction(history) || current === undefined || previous === undefined || explanation === undefined) {
    throw new ArgumentError('This reduction cannot be held.');
  }
  const held = previous.targets;
  return new TargetsRecord({
    effectiveFrom: current.effectiveFrom,
    mode: current.mode,
    tdeeKcal: current.tdeeKcal,
    tdeeSigmaKcal: current.tdeeSigmaKcal,
    tdeeStatus: current.tdeeStatus,
    safetyBodyFatPercent: current.safetyBodyFatPercent,
    // MM-533: the pace asked for is kept, or the engine sees a pace change and undoes the hold at once.
    requestedLossFraction: current.requestedLossFraction,
    leanGainPace: current.leanGainPace,
    profileRevision: current.profileRevision,
    targetRulesVersion: current.targetRulesVersion,
    targets: new DailyTargets({
      kcal: held.kcal,
      proteinG: held.proteinG,
      proteinMinimumG: held.proteinMinimumG,
      fatG: held.fatG,
      carbsG: held.carbsG,
      weeklyRateFraction: held.weeklyRateFraction,
      flags: new Set<TargetFlag>(['heldByUser']),
    }),
    explanation: new TargetsExplanation({
      lines: [...explanation.lines, new ExplanationLine('userHold', held.kcal - current.targets.kcal)],
      previousKcal: held.kcal,
      newKcal: held.kcal,
      estimateStatus: explanation.estimateStatus,
      usableIntakeDays: explanation.usableIntakeDays,
      excludedPartialDays: explanation.excludedPartialDays,
      weighIns: explanation.weighIns,
    }),
  });
}
