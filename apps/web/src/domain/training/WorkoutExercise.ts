import type { WorkoutSet } from './WorkoutSet';

interface WorkoutExerciseInit {
  exerciseId: string;
  sets?: readonly WorkoutSet[];
  restTargetMs?: number | undefined;
}

/** An exercise as done in one workout, with its sets in order (MM-75). */
export class WorkoutExercise {
  /** The `Exercise.id` of a built-in exercise or one of the user's own. */
  readonly exerciseId: string;
  readonly sets: readonly WorkoutSet[];

  /**
   * How long the user means to rest after a set of this exercise, in
   * milliseconds, if they chose a length (MM-191). The rest timer counts
   * down to it.
   */
  readonly restTargetMs: number | undefined;

  constructor(init: WorkoutExerciseInit) {
    this.exerciseId = init.exerciseId;
    this.sets = init.sets ?? [];
    this.restTargetMs = init.restTargetMs;
  }

  withSets(sets: readonly WorkoutSet[]): WorkoutExercise {
    return new WorkoutExercise({ exerciseId: this.exerciseId, sets, restTargetMs: this.restTargetMs });
  }

  withRestTargetMs(restTargetMs: number | undefined): WorkoutExercise {
    return new WorkoutExercise({ exerciseId: this.exerciseId, sets: this.sets, restTargetMs });
  }
}
