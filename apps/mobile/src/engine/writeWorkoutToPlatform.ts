import type { HealthWorkoutWriter } from '../domain/integration/HealthWorkoutWriter';
import type { Exercise } from '../domain/training/Exercise';
import type { Workout } from '../domain/training/Workout';
import { workoutForPlatform } from './workoutForPlatform';

/**
 * Writes a finished workout to the health platform (MM-189) as
 * `workoutForPlatform` describes it. Nothing is written, and false is the
 * answer, unless the user has let the app write workouts; the workout in
 * the app is the same either way.
 */
export async function writeWorkoutToPlatform(
  writer: HealthWorkoutWriter,
  workout: Workout,
  exerciseOf: (exerciseId: string) => Exercise | undefined,
): Promise<boolean> {
  if (!(await writer.writePermitted())) return false;
  const written = workoutForPlatform(workout, exerciseOf, { namesExercises: writer.namesExercises });
  return written === undefined ? false : writer.writeWorkout(written);
}
