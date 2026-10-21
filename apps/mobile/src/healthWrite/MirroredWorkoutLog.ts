import type { HealthWorkoutWriter } from '../domain/integration/HealthWorkoutWriter';
import type { CustomExerciseReader } from '../domain/repositories/CustomExerciseReader';
import type { WorkoutRepository } from '../domain/repositories/WorkoutRepository';
import { builtInExercises } from '../domain/training/builtInExercises';
import type { Exercise } from '../domain/training/Exercise';
import type { Workout } from '../domain/training/Workout';
import { writeWorkoutToPlatform } from '../engine/writeWorkoutToPlatform';
import type { Watched } from '../lang/Watched';

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

  constructor({
    log,
    platform,
    customExercises,
  }: {
    log: WorkoutRepository;
    platform: HealthWorkoutWriter;
    customExercises: CustomExerciseReader;
  }) {
    this.log = log;
    this.platform = platform;
    this.customExercises = customExercises;
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
      return await writeWorkoutToPlatform(this.platform, workout, (exerciseId) => exercises.get(exerciseId));
    } catch {
      return false;
    }
  }
}
