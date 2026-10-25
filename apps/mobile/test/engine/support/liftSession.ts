import type { CalendarDate } from '../../../src/domain/CalendarDate';
import type { ImportedWorkout } from '../../../src/domain/training/ImportedWorkout';
import { Workout } from '../../../src/domain/training/Workout';
import { WorkoutExercise } from '../../../src/domain/training/WorkoutExercise';
import { WorkoutSet } from '../../../src/domain/training/WorkoutSet';

let nextId = 1;

/**
 * A finished workout at six in the evening of `date` (MM-609): for each
 * lift, `sets` identical sets of `reps` at `loadKg`, with `rir` when given.
 * Each gets its own id, as saved workouts do. No lifts is an empty session,
 * such as an import whose platform gave no sets.
 */
export function liftSession(
  date: CalendarDate,
  lifts: readonly (readonly [exerciseId: string, sets: number, reps: number, loadKg: number, rir?: number | undefined])[],
  { imported }: { imported?: ImportedWorkout } = {},
): Workout {
  const id = nextId++;
  const startedAt = new Date(date.year, date.month - 1, date.day, 18, id % 60);
  return new Workout({
    id,
    date,
    startedAt,
    endedAt: new Date(startedAt.getTime() + 50 * 60 * 1000),
    imported,
    exercises: lifts.map(
      ([exerciseId, sets, reps, loadKg, rir]) =>
        new WorkoutExercise({ exerciseId, sets: Array.from({ length: sets }, () => new WorkoutSet({ reps, loadKg, rir })) }),
    ),
  });
}
