import type { HealthWorkoutWriter } from '../domain/integration/HealthWorkoutWriter';
import type { HealthWriteNamespace } from '../healthIngest/HealthWriteNamespace';
import type { CustomExerciseReader } from '../domain/repositories/CustomExerciseReader';
import type { WorkoutRepository } from '../domain/repositories/WorkoutRepository';
import { builtInExercises } from '../domain/training/builtInExercises';
import type { Exercise } from '../domain/training/Exercise';
import type { Workout } from '../domain/training/Workout';
import { writeWorkoutToPlatform } from '../engine/writeWorkoutToPlatform';
import type { Watched } from '../lang/Watched';
import { namespacedWorkoutId } from './namespacedWorkoutId';

/** The value `watched` has now, and no later one. */
function now<T>(watched: Watched<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const state: { done: boolean; stop?: () => void } = { done: false };
    const stop = watched.subscribe(
      (value) => {
        if (state.done) return;
        state.done = true;
        resolve(value);
        state.stop?.();
      },
      (error) => {
        if (!state.done) reject(error);
      },
    );
    // A value given at once arrives before there is anything to stop.
    if (state.done) stop();
    else state.stop = stop;
  });
}

/**
 * The workout log, told to the phone's health platform (MM-489): a workout
 * is written once it is finished, and written again under its own id when
 * a finished one is changed, so the platform holds one workout for it. A
 * workout in progress is never written. The app's log is saved first and is
 * the same whatever the platform does; writing only happens while writing
 * workouts is on (`writeWorkoutToPlatform`).
 */
export class MirroredWorkoutLog implements WorkoutRepository {
  private readonly log: WorkoutRepository;
  private readonly platform: HealthWorkoutWriter;
  private readonly customExercises: CustomExerciseReader;
  private readonly ids: HealthWriteNamespace;

  constructor({
    log,
    platform,
    customExercises,
    ids,
  }: {
    log: WorkoutRepository;
    platform: HealthWorkoutWriter;
    customExercises: CustomExerciseReader;
    /** Where the write namespace is kept (MM-522), so a workout is never written under an id from before an erase. */
    ids: HealthWriteNamespace;
  }) {
    this.log = log;
    this.platform = platform;
    this.customExercises = customExercises;
    this.ids = ids;
  }

  watchWorkouts(): Watched<Workout[]> {
    return this.log.watchWorkouts();
  }

  async saveWorkout(workout: Workout): Promise<number> {
    const id = await this.log.saveWorkout(workout);
    if (workout.endedAt !== undefined) await this.written(workout.id === id ? workout : workout.copyWith({ id }));
    return id;
  }

  deleteWorkout(id: number): Promise<void> {
    return this.log.deleteWorkout(id);
  }

  private async written(workout: Workout): Promise<boolean> {
    try {
      const custom = await now(this.customExercises.watchCustomExercises());
      const exercises = new Map<string, Exercise>(
        [...builtInExercises, ...custom].map((e): [string, Exercise] => [e.id, e]),
      );
      const namespace = await this.ids.writeNamespace();
      const platform = this.platform;
      // The same writer, its client ids carrying this run's namespace after the app's prefix (MM-522).
      const namespaced: HealthWorkoutWriter = {
        namesExercises: platform.namesExercises,
        writePermitted: () => platform.writePermitted(),
        requestWritePermission: () => platform.requestWritePermission(),
        writeWorkout: (written) =>
          platform.writeWorkout({ ...written, clientId: namespacedWorkoutId(written.clientId, namespace) }),
      };
      return await writeWorkoutToPlatform(namespaced, workout, (exerciseId) => exercises.get(exerciseId));
    } catch {
      return false;
    }
  }
}
