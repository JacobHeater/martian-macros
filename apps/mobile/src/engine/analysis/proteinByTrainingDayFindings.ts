import type { CoachFinding } from './CoachFinding';
import { coachFindingOf } from './coachFindingOf';
import { proteinMinimumOn } from './proteinMinimumOn';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * X1, protein on rest and training days (MM-609): over the last 14 whole
 * days, at least 4 of each, the share of days at the protein minimum
 * differs by 30 points or more and the lower is under half. The words name
 * the lower days and say the minimum is the same every day (MM-121): never
 * more protein on training days. MM-610 folds it into N1 when N1 fires.
 */
export function proteinByTrainingDayFindings(context: TrainingAnalysisContext): CoachFinding[] {
  const { input, span, asOf } = context;
  const rule = TrainingAnalysisRule.protein;
  if (span < TrainingAnalysisRule.needsDays.proteinByTrainingDay) return [];
  const from = asOf.addDays(1 - rule.days);
  let trainingDays = 0;
  let trainingMet = 0;
  let restDays = 0;
  let restMet = 0;
  let minimumG: number | undefined;
  const seen = new Set<number>();
  for (const day of [...input.wholeDays].sort((a, b) => a.date.compareTo(b.date))) {
    if (day.date.isBefore(from) || day.date.isAfter(asOf) || seen.has(day.date.epochDay)) continue;
    seen.add(day.date.epochDay);
    const minimum = proteinMinimumOn(input.history, day.date);
    if (minimum === undefined) continue;
    minimumG = minimum;
    const met = day.proteinG >= minimum ? 1 : 0;
    if (context.trainedDays.has(day.date.epochDay)) {
      trainingDays++;
      trainingMet += met;
    } else {
      restDays++;
      restMet += met;
    }
  }
  if (minimumG === undefined || trainingDays < rule.eachDays || restDays < rule.eachDays) return [];
  const trainingShare = trainingMet / trainingDays;
  const restShare = restMet / restDays;
  if (Math.abs(trainingShare - restShare) < rule.gap || Math.min(trainingShare, restShare) >= rule.lowerUnder) return [];
  return [
    coachFindingOf({
      signal: 'proteinByTrainingDay',
      kind: 'fix',
      span,
      from,
      to: asOf,
      priority: 'pattern',
      figures: { trainingDays, trainingMet, restDays, restMet, minimumG, lowerOnRestDays: restShare < trainingShare ? 1 : 0 },
    }),
  ];
}
