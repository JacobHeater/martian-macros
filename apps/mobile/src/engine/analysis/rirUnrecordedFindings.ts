import { isHardSet } from '../isHardSet';
import type { CoachFinding } from './CoachFinding';
import { coachFindingOf } from './coachFindingOf';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import { TrainingAnalysisRule } from './TrainingAnalysisRule';

/**
 * T9, reps in reserve unrecorded (MM-609), data quality: 15 or more hard
 * sets in the last 14 days with reps in reserve recorded on under a quarter
 * of them. A set without it counts as hard (MM-78), so weekly sets may read
 * high.
 */
export function rirUnrecordedFindings(context: TrainingAnalysisContext): CoachFinding[] {
  const { span, asOf } = context;
  const rule = TrainingAnalysisRule.rir;
  if (span < TrainingAnalysisRule.needsDays.rirUnrecorded) return [];
  const from = asOf.addDays(1 - rule.days);
  let hard = 0;
  let recorded = 0;
  for (const workout of context.sessions) {
    if (workout.date.isBefore(from)) continue;
    for (const set of workout.exercises.flatMap((e) => e.sets)) {
      if (!isHardSet(set)) continue;
      hard++;
      if (set.rir !== undefined) recorded++;
    }
  }
  if (hard < rule.hardSets || recorded >= hard * rule.recordedShare) return [];
  return [
    coachFindingOf({
      signal: 'rirUnrecorded',
      kind: 'dataQuality',
      span,
      from,
      to: asOf,
      priority: 'dataQuality',
      figures: { hardSets: hard, recordedSets: recorded, days: rule.days },
    }),
  ];
}
