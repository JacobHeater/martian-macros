import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import type { Exercise } from '../domain/training/Exercise';
import type { Workout } from '../domain/training/Workout';
import type { ItemInsight } from './ItemInsight';
import { strengthOnFatLossInsights } from './strengthOnFatLossInsights';
import type { StrengthTrend } from './StrengthTrend';
import type { TargetsRecord } from './TargetsRecord';
import { volumeJumpInsights } from './volumeJumpInsights';

/** How far back workouts are given their inline insights; an older one shows none. */
const lookBackDays = 90;

/**
 * The training area's inline insights (MM-366, MM-377), for every workout of
 * the last `lookBackDays` days, each judged by its own date.
 */
export function trainingItemInsights({
  workouts,
  exercisesById,
  pauses,
  today,
  trends = [],
  history = [],
  deficitRestartOn,
  progressStalled = false,
}: {
  workouts: readonly Workout[];
  exercisesById: ReadonlyMap<string, Exercise>;
  pauses: readonly Pause[];
  today: CalendarDate;
  trends?: readonly StrengthTrend[];
  history?: readonly TargetsRecord[];
  deficitRestartOn?: CalendarDate | undefined;
  progressStalled?: boolean;
}): ItemInsight[] {
  return workouts
    .filter((workout) => workout.date.daysUntil(today) < lookBackDays)
    .flatMap((workout) => [
      ...volumeJumpInsights({ workout, workouts, exercisesById, pauses }),
      ...strengthOnFatLossInsights({ workout, trends, history, exercisesById, deficitRestartOn, progressStalled }),
    ]);
}
