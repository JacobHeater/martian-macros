import type { CalendarDate } from '../../domain/CalendarDate';
import { CardioRule } from '../CardioRule';
import { pausedDaysBetween } from '../pausedDaysBetween';
import type { CoachFinding } from './CoachFinding';
import { coachFindingOf } from './coachFindingOf';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * C1, the week's cardio minutes from the wearable against the floor
 * (MM-678), on a fat-loss or recomp goal (the owner, 2026-10-28), once the
 * wearable is in use: a session or a day of steps has arrived. The seven
 * days through `asOf` under the floor is a fix, in any span; at or over
 * it in each of the last four weeks is holding up, in a span that long.
 * Silent on maintenance and lean gain, with a floor of none, and when a
 * pause touches the last 14 days, as T1. The fix's order is
 * `trainingAdviceOf`'s, not said under the safeguards that forbid "train
 * more".
 */
export function cardioFindings(context: TrainingAnalysisContext): CoachFinding[] {
  const { input, span, asOf } = context;
  const goal = input.setup.goalMode;
  if (goal !== 'fatLoss' && goal !== 'recomp') return [];
  if (input.cardio.length === 0 && input.steps.length === 0) return [];
  if (pausedDaysBetween(input.pauses, asOf.addDays(1 - TrainingAnalysisRule.pauseSilencesDays), asOf) > 0) return [];
  const floor = input.cardioFloors.minutesPerWeek ?? CardioRule.minutesPerWeek;
  if (floor <= 0) return [];
  const week = (through: CalendarDate) => {
    const from = through.addDays(-6);
    let minutes = 0;
    let sessions = 0;
    for (const session of input.cardio) {
      if (session.date.isBefore(from) || session.date.isAfter(through)) continue;
      minutes += session.minutes;
      sessions++;
    }
    return { minutes, sessions };
  };
  const current = week(asOf);
  const base = { signal: 'cardioMinutes', span } as const;
  if (current.minutes < floor) {
    return [
      coachFindingOf({
        ...base,
        kind: 'fix',
        from: asOf.addDays(-6),
        to: asOf,
        priority: 'coaching',
        figures: { minutes: current.minutes, floor, more: floor - current.minutes, sessions: current.sessions, days: 7 },
      }),
    ];
  }
  if (span < TrainingAnalysisRule.needsDays.cardioHoldingUp) return [];
  const weeks = CardioRule.holdingUpWeeks;
  for (let back = 1; back < weeks; back++) {
    if (week(asOf.addDays(-7 * back)).minutes < floor) return [];
  }
  return [
    coachFindingOf({
      ...base,
      kind: 'holdingUp',
      from: asOf.addDays(1 - 7 * weeks),
      to: asOf,
      priority: 'pattern',
      figures: { weeks, minutes: current.minutes, floor, sessions: current.sessions },
    }),
  ];
}
