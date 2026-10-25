import type { CoachFinding } from './CoachFinding';
import { coachFindingOf } from './coachFindingOf';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * X3, water on training days (MM-609): water logged on 10 or more of the
 * last 14 days, and on at least half of 4 or more training days with water
 * logged, 500 ml or more under the goal and under the rest-day average.
 * Holding up: water logged on most days and the training days at the goal.
 * It reads what was logged, never hydration. Said only with a goal the app
 * suggested (MM-367's rule: a goal set under a clinician's fluid limit gets
 * no line), and not with an eating-disorder history or under-eating.
 */
export function waterOnTrainingDaysFindings(context: TrainingAnalysisContext): CoachFinding[] {
  const { input, span, asOf, restricted } = context;
  const rule = TrainingAnalysisRule.water;
  const goal = input.waterGoal;
  if (restricted || goal === undefined || goal.suggestedMl === undefined || span < TrainingAnalysisRule.needsDays.waterOnTrainingDays) {
    return [];
  }
  const from = asOf.addDays(1 - rule.days);
  const byDay = new Map<number, number>();
  for (const entry of input.water) {
    if (entry.date.isBefore(from) || entry.date.isAfter(asOf)) continue;
    byDay.set(entry.date.epochDay, (byDay.get(entry.date.epochDay) ?? 0) + entry.ml);
  }
  if (byDay.size < rule.loggedDays) return [];
  const training: number[] = [];
  const rest: number[] = [];
  for (const [day, ml] of byDay) (context.trainedDays.has(day) ? training : rest).push(ml);
  if (training.length < rule.trainingDays) return [];
  const mean = (values: readonly number[]) => values.reduce((a, b) => a + b, 0) / values.length;
  const trainingAverageMl = mean(training);
  const figures = { loggedDays: byDay.size, days: rule.days, trainingDays: training.length, goalMl: goal.ml, trainingAverageMl };
  const base = { signal: 'waterOnTrainingDays', span, from, to: asOf, priority: 'pattern' } as const;
  if (rest.length > 0) {
    const restAverageMl = mean(rest);
    const under = training.filter((ml) => ml <= goal.ml - rule.underMl && ml < restAverageMl).length;
    if (under >= training.length * rule.underShare) {
      return [coachFindingOf({ ...base, kind: 'fix', figures: { ...figures, underDays: under, restAverageMl } })];
    }
  }
  const atGoal = training.filter((ml) => ml >= goal.ml).length;
  if (atGoal >= training.length * rule.atGoalShare) {
    return [coachFindingOf({ ...base, kind: 'holdingUp', figures: { ...figures, atGoalDays: atGoal } })];
  }
  return [];
}
