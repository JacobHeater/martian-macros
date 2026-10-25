import { StrengthOnFatLossRule } from '../StrengthOnFatLossRule';
import type { CoachFinding } from './CoachFinding';
import { coachFindingOf } from './coachFindingOf';
import { regularLiftOf } from './regularLiftOf';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * T5, strength rising (MM-609), on maintenance and lean gain only (on fat
 * loss, rising is not a finding): a regular lift's smoothed estimated max
 * (MM-77) up 5% or more (MM-377's `upBy`) over the span. Holding up, at
 * most 2 lifts, the most risen first.
 */
export function strengthRisingFindings(context: TrainingAnalysisContext): CoachFinding[] {
  const { input, span, asOf, spanStart } = context;
  const goal = input.setup.goalMode;
  if ((goal !== 'maintenance' && goal !== 'leanGain') || span < TrainingAnalysisRule.needsDays.strength) return [];
  const rising = context.trends.flatMap((trend) => {
    const lift = regularLiftOf(trend, spanStart, asOf);
    if (lift === undefined) return [];
    const ratio = lift.last.trendKg / lift.first.trendKg;
    return ratio >= 1 + StrengthOnFatLossRule.upBy ? [{ trend, lift, ratio }] : [];
  });
  return rising
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, TrainingAnalysisRule.strength.risingLifts)
    .map(({ trend, lift }) =>
      coachFindingOf({
        signal: 'strengthRising',
        kind: 'holdingUp',
        key: trend.exerciseId,
        span,
        from: lift.first.date,
        to: lift.last.date,
        priority: 'pattern',
        subjects: [trend.name],
        figures: {
          fromKg: lift.first.trendKg,
          toKg: lift.last.trendKg,
          days: lift.first.date.daysUntil(lift.last.date),
          sessions: lift.sessions,
        },
      }),
    );
}
