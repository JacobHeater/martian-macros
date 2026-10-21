import type { CalendarDate } from '../domain/CalendarDate';
import type { Clock } from '../domain/integration/Clock';
import type { WorkoutWriter } from '../domain/repositories/WorkoutWriter';
import { Exercise } from '../domain/training/Exercise';
import { Workout } from '../domain/training/Workout';
import { WorkoutExercise } from '../domain/training/WorkoutExercise';
import { WorkoutSet } from '../domain/training/WorkoutSet';

/** The workout with a pause that is running ended at `now`, its length left out of the workout. */
function resumed(workout: Workout, now: Date): Workout {
  const pausedAt = workout.pausedAt;
  if (pausedAt === undefined) return workout;
  return workout.copyWith({
    pausedAt: undefined,
    pausedForMs: workout.pausedForMs + (now.getTime() - pausedAt.getTime()),
  });
}

/**
 * Starts, changes and finishes workouts (MM-75). Every change is saved at
 * once, so a workout survives the app closing mid-session.
 */
export class WorkoutController {
  private readonly workouts: WorkoutWriter;
  private readonly clock: Clock;

  constructor({ workouts, clock }: { workouts: WorkoutWriter; clock: Clock }) {
    this.workouts = workouts;
    this.clock = clock;
  }

  /**
   * Starts a workout now. With `from`, it starts with that workout's
   * exercises and their rest targets, and no sets. Gives its id.
   */
  start({ from }: { from?: Workout | undefined } = {}): Promise<number> {
    return this.workouts.saveWorkout(
      new Workout({
        id: 0,
        date: this.clock.today(),
        startedAt: this.clock.now(),
        // "Other exercise" is an imported placeholder (MM-490), not something to repeat.
        exercises: (from?.exercises ?? [])
          .filter((exercise) => exercise.exerciseId !== Exercise.otherId)
          .map((exercise) => new WorkoutExercise({ exerciseId: exercise.exerciseId, restTargetMs: exercise.restTargetMs })),
      }),
    );
  }

  /** Ends the workout now. A pause still running ends with it. */
  async finish(workout: Workout): Promise<void> {
    const now = this.clock.now();
    await this.workouts.saveWorkout(resumed(workout, now).copyWith({ endedAt: now, setStartedAt: undefined }));
  }

  /**
   * Stops the workout's clock until it is resumed (MM-191). A set being
   * timed is dropped: a pause is not part of a set.
   */
  async pause(workout: Workout): Promise<void> {
    if (workout.paused || !workout.inProgress) return;
    await this.workouts.saveWorkout(workout.copyWith({ pausedAt: this.clock.now(), setStartedAt: undefined }));
  }

  /** Starts the clock again; the time paused is left out of the workout. */
  async resume(workout: Workout): Promise<void> {
    await this.workouts.saveWorkout(resumed(workout, this.clock.now()));
  }

  /** Starts timing a set (MM-191). The next set added takes this as its start. */
  async startSet(workout: Workout): Promise<void> {
    await this.workouts.saveWorkout(workout.copyWith({ setStartedAt: this.clock.now() }));
  }

  /** Stops the set timer without logging a set. */
  async cancelSet(workout: Workout): Promise<void> {
    await this.workouts.saveWorkout(workout.copyWith({ setStartedAt: undefined }));
  }

  /**
   * Sets a workout's day, start and end by hand (MM-191). The caller has
   * checked that they make sense.
   */
  async setTimes(
    workout: Workout,
    { date, startedAt, endedAt }: { date: CalendarDate; startedAt: Date; endedAt: Date | undefined },
  ): Promise<void> {
    // Typed times are the truth: pauses longer than the workout they now
    // describe are dropped.
    const spanMs = (endedAt ?? this.clock.now()).getTime() - startedAt.getTime();
    await this.workouts.saveWorkout(
      workout.copyWith({ date, startedAt, endedAt, ...(workout.pausedForMs > spanMs ? { pausedForMs: 0 } : {}) }),
    );
  }

  /** Starts a workout in progress again from now, for one opened before the training began. */
  async restartClock(workout: Workout): Promise<void> {
    await this.workouts.saveWorkout(
      workout.copyWith({ date: this.clock.today(), startedAt: this.clock.now(), pausedAt: undefined, pausedForMs: 0 }),
    );
  }

  delete(workout: Workout): Promise<void> {
    return this.workouts.deleteWorkout(workout.id);
  }

  /** Adds an exercise, with the rest target it had last, if any. */
  async addExercise(
    workout: Workout,
    exerciseId: string,
    { restTargetMs }: { restTargetMs?: number | undefined } = {},
  ): Promise<void> {
    await this.workouts.saveWorkout(
      workout.copyWith({ exercises: [...workout.exercises, new WorkoutExercise({ exerciseId, restTargetMs })] }),
    );
  }

  /**
   * Sets how long the user means to rest after a set of the exercise at
   * `index` (MM-191), or none. A rest already running is measured against
   * it from when that rest began.
   */
  async setRestTarget(workout: Workout, index: number, targetMs: number | undefined): Promise<void> {
    await this.workouts.saveWorkout(
      workout.copyWith({
        exercises: workout.exercises.map((exercise, i) => (i === index ? exercise.withRestTargetMs(targetMs) : exercise)),
      }),
    );
  }

  /**
   * Moves the sets of the exercise at `index` to `exerciseId` (MM-490): how
   * an imported "Other exercise" becomes the exercise the user says it was.
   * Its sets, their times and its rest target are kept.
   */
  async moveExercise(workout: Workout, index: number, exerciseId: string): Promise<void> {
    await this.workouts.saveWorkout(
      workout.copyWith({
        exercises: workout.exercises.map((exercise, i) =>
          i === index ? new WorkoutExercise({ exerciseId, sets: exercise.sets, restTargetMs: exercise.restTargetMs }) : exercise,
        ),
      }),
    );
  }

  async removeExercise(workout: Workout, index: number): Promise<void> {
    await this.workouts.saveWorkout(workout.copyWith({ exercises: workout.exercises.filter((_, i) => i !== index) }));
  }

  /**
   * Adds a set to the exercise at `index`: a copy of its previous set, or
   * else of `lastTime`, the first set of the last session, or else an empty
   * one. Reps in reserve are not copied; they are a judgment of one set.
   *
   * In a workout in progress the set ends now, and began when the set
   * timer was started, if it was (MM-191). A set added to a finished
   * workout has no times; none are invented.
   */
  addSet(workout: Workout, index: number, { lastTime }: { lastTime?: WorkoutSet | undefined } = {}): Promise<void> {
    const sets = workout.exercises[index]?.sets ?? [];
    const like = sets[sets.length - 1] ?? lastTime;
    return this.withSets(workout.copyWith({ setStartedAt: undefined }), index, [
      ...sets,
      new WorkoutSet({
        reps: like?.reps ?? 0,
        loadKg: like?.loadKg ?? 0,
        startedAt: workout.inProgress ? workout.setStartedAt : undefined,
        endedAt: workout.inProgress ? this.clock.now() : undefined,
      }),
    ]);
  }

  updateSet(workout: Workout, index: number, setIndex: number, set: WorkoutSet): Promise<void> {
    const sets = workout.exercises[index]?.sets ?? [];
    return this.withSets(
      workout,
      index,
      sets.map((existing, i) => (i === setIndex ? set : existing)),
    );
  }

  removeSet(workout: Workout, index: number, setIndex: number): Promise<void> {
    const sets = workout.exercises[index]?.sets ?? [];
    return this.withSets(
      workout,
      index,
      sets.filter((_, i) => i !== setIndex),
    );
  }

  /**
   * Puts a removed set back where it was (MM-215), times and all. Its place
   * is clamped to the sets there now.
   */
  restoreSet(workout: Workout, index: number, setIndex: number, set: WorkoutSet): Promise<void> {
    const sets = workout.exercises[index]?.sets ?? [];
    const at = Math.min(setIndex, sets.length);
    return this.withSets(workout, index, [...sets.slice(0, at), set, ...sets.slice(at)]);
  }

  private async withSets(workout: Workout, index: number, sets: readonly WorkoutSet[]): Promise<void> {
    await this.workouts.saveWorkout(
      workout.copyWith({
        exercises: workout.exercises.map((exercise, i) => (i === index ? exercise.withSets(sets) : exercise)),
      }),
    );
  }
}
