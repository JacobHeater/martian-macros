import { assessTrainingLapse } from '../assessTrainingLapse';
import { pausedDaysBetween } from '../pausedDaysBetween';
import { TrainingRule } from '../TrainingRule';
import type { CoachFinding } from './CoachFinding';
import { coachFindingOf } from './coachFindingOf';
import { daysTrainedBetween } from './daysTrainedBetween';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * T1, training stopped (MM-609), reusing MM-134's lapse as of `asOf`: no
 * session for 14 days on a deficit or a gain, the surplus suspended at 21
 * on lean gain. Silent on maintenance, and when a pause touches the last 14
 * days. Holding up: a session in each of the last 4 weeks, in a span that
 * long. A notice here suppresses T2 to T9.
 */
export function trainingStoppedFindings(context: TrainingAnalysisContext): CoachFinding[] {
  const { input, span, asOf } = context;
  const rule = TrainingAnalysisRule;
  if (pausedDaysBetween(input.pauses, asOf.addDays(1 - rule.pauseSilencesDays), asOf) > 0) return [];
  const lapse = assessTrainingLapse({ setup: input.setup, workouts: input.workouts, pauses: input.pauses, today: asOf });
  if (lapse.kind !== 'none' && lapse.daysSince !== undefined && lapse.lastTrainedOn !== undefined) {
    return [
      coachFindingOf({
        signal: 'trainingStopped',
        kind: 'fix',
        span,
        from: lapse.lastTrainedOn,
        to: asOf,
        priority: 'coaching',
        figures: {
          daysSince: lapse.daysSince,
          suspended: lapse.kind === 'suspend' ? 1 : 0,
          leanGain: lapse.goal === 'leanGain' ? 1 : 0,
          suspendAfterDays: TrainingRule.suspendAfterDays,
        },
      }),
    ];
  }
  if (span < rule.needsDays.lapseHoldingUp) return [];
  const weeks = rule.lapseHoldingUpWeeks;
  let sessions = 0;
  for (let week = 0; week < weeks; week++) {
    const trained = daysTrainedBetween(context, asOf.addDays(-7 * week - 6), asOf.addDays(-7 * week));
    if (trained === 0) return [];
    sessions += trained;
  }
  return [
    coachFindingOf({
      signal: 'trainingStopped',
      kind: 'holdingUp',
      span,
      from: asOf.addDays(1 - 7 * weeks),
      to: asOf,
      priority: 'pattern',
      figures: { weeks, sessions },
    }),
  ];
}
