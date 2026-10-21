import type { HealthWorkoutReader } from '../domain/integration/HealthWorkoutReader';
import type { HealthWorkoutWriter } from '../domain/integration/HealthWorkoutWriter';
import type { PlatformWorkout } from '../domain/training/PlatformWorkout';

/**
 * Where workouts cannot be read from or written to a health platform: a
 * browser, or a shell whose plugin does not do it yet (MM-189). Nothing is
 * read, writing is never permitted, and nothing is written.
 */
export class NoHealthWorkouts implements HealthWorkoutReader, HealthWorkoutWriter {
  readonly namesExercises = false;

  readWorkouts(): Promise<PlatformWorkout[]> {
    return Promise.resolve([]);
  }

  writePermitted(): Promise<boolean> {
    return Promise.resolve(false);
  }

  requestWritePermission(): Promise<boolean> {
    return Promise.resolve(false);
  }

  writeWorkout(): Promise<boolean> {
    return Promise.resolve(false);
  }

  removeWorkout(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
