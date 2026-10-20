import type { CoachConfidence } from './CoachConfidence';
import type { DailyTargets } from './DailyTargets';
import { ExplanationLine } from './ExplanationLine';
import type { ExplanationReason } from './ExplanationReason';
import type { ExplanationTrigger } from './ExplanationTrigger';
import { shortSleep } from './shortSleep';
import type { SleepAverage } from './SleepAverage';
import { TargetsExplanation } from './TargetsExplanation';
import type { TargetsRecord } from './TargetsRecord';
import type { TargetsTrace } from './TargetsTrace';
import type { TdeeEstimate } from './TdeeEstimate';

/** The cause the rest of the ordinary calculation is put down to. */
function reasonFor(trigger: ExplanationTrigger): ExplanationReason {
  switch (trigger) {
    case 'goalChange':
      return 'goalChange';
    case 'profileCorrection':
      return 'profileCorrection';
    case 'appRuleUpdate':
      return 'appRuleUpdate';
    case 'healthRule':
      return 'healthRule';
    case 'underweightRule':
      return 'underweightRule';
    case 'bodyFatCorrection':
      return 'bodyFatEstimate';
    case 'paceChange':
      return 'paceChange';
    case 'trainingLapse':
      return 'trainingLapse';
    case 'breakEnded':
      return 'breakEnded';
    default:
      return 'paceAndWeight';
  }
}

/**
 * Why `targets` differ from `previous`, as contributions that add up to the
 * change in calories (MM-138).
 *
 * The change is split in the order the calculation runs: the move in
 * expenditure, everything else in the ordinary formula, then each limit that
 * acted. Nothing is attributed to a day's eating: the engine estimates
 * expenditure, it does not react to intake. Sleep that averaged short over
 * the window is noted beside the lines (MM-252), never as a line: it moved
 * no number.
 */
export function explainTargets({
  trigger,
  previous,
  targets,
  trace,
  tdee,
  confidence,
  sleepAverage,
}: {
  trigger: ExplanationTrigger;
  previous: TargetsRecord | undefined;
  targets: DailyTargets;
  trace: TargetsTrace;
  tdee: TdeeEstimate;
  confidence?: CoachConfidence | undefined;
  /** The fourteen-night average as of these targets (MM-250); undefined with no nights recorded. */
  sleepAverage?: SleepAverage | undefined;
}): TargetsExplanation {
  const lines: ExplanationLine[] = [];
  const add = (reason: ExplanationReason, kcal: number, ends: { from?: number; to?: number } = {}) => {
    if (Math.abs(kcal) >= 0.5) {
      lines.push(new ExplanationLine(reason, kcal, ends));
    }
  };

  const base = previous?.targets.kcal;
  if (previous === undefined || base === undefined) {
    lines.push(new ExplanationLine('firstTargets', trace.finalKcal));
  } else {
    const expenditure = tdee.kcal - previous.tdeeKcal;
    add('expenditureEstimate', expenditure, { from: previous.tdeeKcal, to: tdee.kcal });
    const rest = trace.formulaKcal - base - expenditure;
    add(
      targets.flags.has('requestedBreak')
        ? 'requestedBreak'
        : targets.flags.has('dietBreak')
          ? 'dietBreak'
          : targets.flags.has('trainingLapsed') && !(previous.targets.flags.has('trainingLapsed'))
            ? 'trainingLapse'
            : reasonFor(trigger),
      rest,
    );
    add('stepLimit', trace.limitedKcal - trace.formulaKcal);
    add('holdAfterRaise', trace.heldKcal - trace.limitedKcal);
    add('safetyRaise', trace.raisedKcal - trace.heldKcal);
    add('calorieFloor', trace.finalKcal - trace.raisedKcal, { from: trace.raisedKcal, to: trace.finalKcal });
  }

  return new TargetsExplanation({
    lines,
    newKcal: trace.finalKcal,
    previousKcal: base,
    estimateStatus: tdee.status,
    usableIntakeDays: tdee.usableIntakeDays,
    excludedPartialDays: tdee.excludedPartialDays,
    weighIns: tdee.weighIns,
    confidence,
    shortSleepAverageMinutes: shortSleep(sleepAverage) ? sleepAverage?.averageMinutes : undefined,
    shortSleepNights: shortSleep(sleepAverage) ? sleepAverage?.nights : undefined,
  });
}
