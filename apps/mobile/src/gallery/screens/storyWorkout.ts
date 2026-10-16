import type { CalendarDate } from '../../domain/CalendarDate';
import { Workout } from '../../domain/training/Workout';
import { WorkoutExercise } from '../../domain/training/WorkoutExercise';
import { WorkoutSet } from '../../domain/training/WorkoutSet';

/** A fifty-minute workout at six in the evening of `date`, one set of each lift given, for a story (MM-321). */
export function storyWorkout(
  date: CalendarDate,
  lifts: readonly (readonly [exerciseId: string, reps: number, loadKg: number])[],
): Workout {
  const startedAt = new Date(date.year, date.month - 1, date.day, 18);
  return new Workout({
    id: 0,
    date,
    startedAt,
    endedAt: new Date(startedAt.getTime() + 50 * 60 * 1000),
    exercises: lifts.map(([exerciseId, reps, loadKg]) => new WorkoutExercise({ exerciseId, sets: [new WorkoutSet({ reps, loadKg })] })),
  });
}
