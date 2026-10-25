import { usualTrainingWeekdays } from '../usualTrainingWeekdays';
import type { CoachFinding } from './CoachFinding';
import { coachFindingOf } from './coachFindingOf';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * T8, training days (MM-609): 2 or more usual weekdays
 * (`usualTrainingWeekdays`, MM-124, over the 4 weeks through `asOf`), each
 * trained in 3 or more of those weeks. Holding up; nothing to change.
 */
export function trainingDaysFindings(context: TrainingAnalysisContext): CoachFinding[] {
  const { span, asOf } = context;
  const rule = TrainingAnalysisRule.trainingDays;
  if (span < TrainingAnalysisRule.needsDays.trainingDays) return [];
  const from = asOf.addDays(1 - 7 * rule.weeks);
  const weeksOn = (weekday: number) => {
    let weeks = 0;
    for (let day = from; !day.isAfter(asOf); day = day.addDays(1)) {
      if (day.weekday === weekday && context.trainedDays.has(day.epochDay)) weeks++;
    }
    return weeks;
  };
  // The usual weekdays read the 4 weeks before the day given, not that day: the day after `asOf`.
  const usual = usualTrainingWeekdays({ workouts: context.sessions, today: asOf.addDays(1) }).filter(
    (weekday) => weeksOn(weekday) >= rule.weeksTrained,
  );
  if (usual.length < rule.usualWeekdays) return [];
  const figures: Record<string, number> = { weekdays: usual.length, weeks: rule.weeks };
  usual.forEach((weekday, i) => {
    figures[`weekday${i}`] = weekday;
    figures[`weeksOn${i}`] = weeksOn(weekday);
  });
  return [coachFindingOf({ signal: 'trainingDays', kind: 'holdingUp', span, from, to: asOf, priority: 'pattern', figures })];
}
