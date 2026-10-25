import { suggestProgression } from '../suggestProgression';
import { StrengthOnFatLossRule } from '../StrengthOnFatLossRule';
import type { CoachFinding } from './CoachFinding';
import { coachFindingOf } from './coachFindingOf';
import { regularLiftOf } from './regularLiftOf';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * T6, strength stalled (MM-609), on maintenance and lean gain only (MM-79
 * says nothing of a stall on fat loss): 2 or more regular lifts each
 * stalled as MM-79's `suggestProgression` judges it (its "hold") and within
 * ±2.5% (MM-377's `heldTolerance`) over the span. Named, at most 3.
 */
export function strengthStalledFindings(context: TrainingAnalysisContext): CoachFinding[] {
  const { input, span, asOf, spanStart } = context;
  const goal = input.setup.goalMode;
  if ((goal !== 'maintenance' && goal !== 'leanGain') || span < TrainingAnalysisRule.needsDays.strength) return [];
  const next = asOf.addDays(1);
  const before = new Date(next.year, next.month - 1, next.day);
  const stalled = context.trends.flatMap((trend) => {
    const lift = regularLiftOf(trend, spanStart, asOf);
    if (lift === undefined) return [];
    if (Math.abs(lift.last.trendKg / lift.first.trendKg - 1) > StrengthOnFatLossRule.heldTolerance) return [];
    const suggestion = suggestProgression({
      exerciseId: trend.exerciseId,
      exercise: trend.exercise,
      workouts: context.sessions,
      before,
      goal,
      units: input.setup.unitSystem,
      settings: input.progressions?.get(trend.exerciseId),
    });
    return suggestion?.kind === 'hold' ? [{ trend, lift }] : [];
  });
  if (stalled.length < TrainingAnalysisRule.strength.stalledLifts) return [];
  const named = stalled.slice(0, TrainingAnalysisRule.strength.namedLifts);
  const ends: Record<string, number> = {};
  named.forEach(({ lift }, i) => {
    ends[`from${i}Kg`] = lift.first.trendKg;
    ends[`to${i}Kg`] = lift.last.trendKg;
  });
  return [
    coachFindingOf({
      signal: 'strengthStalled',
      kind: 'fix',
      span,
      from: spanStart,
      to: asOf,
      priority: 'coaching',
      subjects: named.map(({ trend }) => trend.name),
      figures: {
        lifts: stalled.length,
        days: Math.min(...named.map(({ lift }) => lift.first.date.daysUntil(lift.last.date))),
        tolerance: StrengthOnFatLossRule.heldTolerance,
        ...ends,
      },
    }),
  ];
}
