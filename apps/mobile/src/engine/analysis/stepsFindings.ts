import type { CalendarDate } from '../../domain/CalendarDate';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { CardioRule } from '../CardioRule';
import { pausedDaysBetween } from '../pausedDaysBetween';
import type { CoachFinding } from './CoachFinding';
import { coachFindingOf } from './coachFindingOf';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * C2, the week's steps a day from the platform against the floor (MM-678),
 * on a fat-loss or recomp goal (the owner, 2026-10-28), once the wearable
 * is in use. The seven days through `asOf` are judged on their average
 * over the days with a total, with at least `stepsJudgedDays` of them;
 * under the floor is a fix, in any span; at or over it in each of the
 * last four weeks is holding up, in a span that long. Silent on
 * maintenance and lean gain, and when a pause touches the last 14 days, as
 * T1. The fix's order is `trainingAdviceOf`'s, not said under the
 * safeguards that forbid "train more".
 */
export function stepsFindings(context: TrainingAnalysisContext): CoachFinding[] {
  const { input, span, asOf } = context;
  const goal = input.setup.goalMode;
  if (goal !== 'fatLoss' && goal !== 'recomp') return [];
  if (input.cardio.length === 0 && input.steps.length === 0) return [];
  if (pausedDaysBetween(input.pauses, asOf.addDays(1 - TrainingAnalysisRule.pauseSilencesDays), asOf) > 0) return [];
  const floor = input.cardioFloors.stepsPerDay ?? CardioRule.stepsPerDay;
  const week = (through: CalendarDate) => {
    const from = through.addDays(-6);
    let sum = 0;
    let days = 0;
    for (const day of input.steps) {
      if (day.date.isBefore(from) || day.date.isAfter(through)) continue;
      sum += day.steps;
      days++;
    }
    return { average: days === 0 ? undefined : roundHalfAwayFromZero(sum / days), days };
  };
  const current = week(asOf);
  if (current.average === undefined || current.days < CardioRule.stepsJudgedDays) return [];
  const base = { signal: 'stepsPerDay', span } as const;
  if (current.average < floor) {
    return [
      coachFindingOf({
        ...base,
        kind: 'fix',
        from: asOf.addDays(-6),
        to: asOf,
        priority: 'coaching',
        figures: { steps: current.average, floor, short: floor - current.average, days: current.days },
      }),
    ];
  }
  if (span < TrainingAnalysisRule.needsDays.cardioHoldingUp) return [];
  const weeks = CardioRule.holdingUpWeeks;
  for (let back = 1; back < weeks; back++) {
    const before = week(asOf.addDays(-7 * back));
    if (before.average === undefined || before.days < CardioRule.stepsJudgedDays || before.average < floor) return [];
  }
  return [
    coachFindingOf({
      ...base,
      kind: 'holdingUp',
      from: asOf.addDays(1 - 7 * weeks),
      to: asOf,
      priority: 'pattern',
      figures: { weeks, steps: current.average, floor, days: current.days },
    }),
  ];
}
