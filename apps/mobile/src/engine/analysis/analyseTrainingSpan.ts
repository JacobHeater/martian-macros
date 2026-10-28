import type { CalendarDate } from '../../domain/CalendarDate';
import type { Exercise } from '../../domain/training/Exercise';
import { buildStrengthTrends } from '../buildStrengthTrends';
import { hasHardSet } from '../hasHardSet';
import type { TrendSpan } from '../trends/TrendSpan';
import { cardioFindings } from './cardioFindings';
import type { CoachFinding } from './CoachFinding';
import { proteinByTrainingDayFindings } from './proteinByTrainingDayFindings';
import { rirUnrecordedFindings } from './rirUnrecordedFindings';
import { setsPerMuscleFindings } from './setsPerMuscleFindings';
import { stepsFindings } from './stepsFindings';
import { strengthOnFatLossFindings } from './strengthOnFatLossFindings';
import { strengthRisingFindings } from './strengthRisingFindings';
import { strengthStalledFindings } from './strengthStalledFindings';
import { trainingAdviceOf } from './trainingAdviceOf';
import type { TrainingAnalysisContext } from './TrainingAnalysisContext';
import type { TrainingAnalysisInput } from './TrainingAnalysisInput';
import { trainingDaysFindings } from './trainingDaysFindings';
import { trainingDroppedFindings } from './trainingDroppedFindings';
import { trainingStoppedFindings } from './trainingStoppedFindings';
import { waterOnTrainingDaysFindings } from './waterOnTrainingDaysFindings';

/**
 * What the coach reads in training, water and sleep over a span ending on
 * `asOf`, which is yesterday (MM-609): T1, T2, T3, T5, T6, T7, T8, T9, X1
 * and X3, and the wearable's cardio and steps against their floors, C1 and
 * C2 (MM-678), unranked (MM-605's ranking and MM-610's sections place them).
 *
 * - A session is a finished workout with at least one hard set.
 * - Training reads weeks: rest days are real zeros, not missing days.
 * - Each signal is the rule that already exists where there is one
 *   (`assessTrainingLapse`, `buildWeeklyVolume`, `buildStrengthTrends`,
 *   `fallingLifts`, `strengthOnFatLossInsights`, `suggestProgression`,
 *   `usualTrainingWeekdays`, `shortSleep`), read, not repeated.
 * - A signal needing more days than the span is not run here;
 *   `unjudgedTrainingAreas` names its area instead.
 * - A training-stopped notice (T1) suppresses T2 to T9, not C1 and C2: the
 *   cardio floor stands whether or not the lifting stopped.
 * - Every fix ends in an order (MM-617, `trainingAdviceOf`); a fix left
 *   with none is not said.
 *
 * Pure: nothing after `asOf` is read, and nothing is stored.
 */
export function analyseTrainingSpan(input: TrainingAnalysisInput, span: TrendSpan, asOf: CalendarDate): CoachFinding[] {
  const sessions = input.workouts.filter((w) => !w.inProgress && !w.date.isAfter(asOf) && hasHardSet(w));
  const exercisesById = new Map<string, Exercise>();
  for (const exercise of input.exercises) exercisesById.set(exercise.id, exercise);
  const context: TrainingAnalysisContext = {
    input,
    span,
    asOf,
    spanStart: asOf.addDays(1 - span),
    sessions,
    trainedDays: new Set(sessions.map((w) => w.date.epochDay)),
    exercisesById,
    trends: buildStrengthTrends({ workouts: sessions, exercises: input.exercises, weights: input.weights, today: asOf }),
    restricted: input.safeguards.eatingDisorderHistory || input.safeguards.underEating,
  };
  const stopped = trainingStoppedFindings(context);
  const besideTraining = [
    ...proteinByTrainingDayFindings(context),
    ...waterOnTrainingDaysFindings(context),
    ...cardioFindings(context),
    ...stepsFindings(context),
  ];
  if (stopped.some((f) => f.kind === 'fix')) return ordered([...stopped, ...besideTraining], context.restricted);
  return ordered([
    ...stopped,
    ...trainingDroppedFindings(context),
    ...setsPerMuscleFindings(context),
    ...strengthRisingFindings(context),
    ...strengthStalledFindings(context),
    ...strengthOnFatLossFindings(context),
    ...trainingDaysFindings(context),
    ...rirUnrecordedFindings(context),
    ...besideTraining,
  ], context.restricted);
}

/** Each fix with its orders; a fix with none is left out. */
function ordered(findings: readonly CoachFinding[], restricted: boolean): CoachFinding[] {
  return findings.flatMap((f) => {
    if (f.kind !== 'fix') return [f];
    const advice = trainingAdviceOf(f, restricted);
    return advice.length === 0 ? [] : [{ ...f, advice }];
  });
}
