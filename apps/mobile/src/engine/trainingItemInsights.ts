import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import type { Exercise } from '../domain/training/Exercise';
import type { Workout } from '../domain/training/Workout';
import type { ItemInsight } from './ItemInsight';
import { volumeJumpInsights } from './volumeJumpInsights';

/** How far back workouts are given their inline insights; an older one shows none. */
const lookBackDays = 90;

/**
 * The training area's inline insights (MM-366), for every workout of the
 * last `lookBackDays` days, each judged by its own weeks.
 */
export function trainingItemInsights({
  workouts,
  exercisesById,
  pauses,
  today,
}: {
  workouts: readonly Workout[];
  exercisesById: ReadonlyMap<string, Exercise>;
  pauses: readonly Pause[];
  today: CalendarDate;
}): ItemInsight[] {
  return workouts
    .filter((workout) => workout.date.daysUntil(today) < lookBackDays)
    .flatMap((workout) => volumeJumpInsights({ workout, workouts, exercisesById, pauses }));
}
