import { ArgumentError } from '../../lang/ArgumentError';

interface ExerciseProgressionInit {
  exerciseId: string;
  repsLow: number;
  repsHigh: number;
  loadStepKg?: number | undefined;
}

/**
 * How the user wants suggestions made for one exercise (MM-79): the rep
 * range to work within and, if they chose one, the step to add load by.
 * An exercise without one uses the defaults.
 */
export class ExerciseProgression {
  /** The most reps a range may run to. */
  static readonly maxReps = 50;

  /** The `Exercise.id` it is for. */
  readonly exerciseId: string;

  /** The bottom and the top of the rep range. */
  readonly repsLow: number;
  readonly repsHigh: number;

  /**
   * What to add when every set reaches the top; undefined for the default
   * step of the exercise's equipment.
   */
  readonly loadStepKg: number | undefined;

  constructor(init: ExerciseProgressionInit) {
    if (!(init.repsLow >= 1 && init.repsLow < init.repsHigh)) {
      throw new ArgumentError('A range of at least two.');
    }
    if (!(init.loadStepKg === undefined || init.loadStepKg > 0)) {
      throw new ArgumentError('A step above zero.');
    }
    this.exerciseId = init.exerciseId;
    this.repsLow = init.repsLow;
    this.repsHigh = init.repsHigh;
    this.loadStepKg = init.loadStepKg;
  }

  equals(other: ExerciseProgression): boolean {
    return (
      other.exerciseId === this.exerciseId &&
      other.repsLow === this.repsLow &&
      other.repsHigh === this.repsHigh &&
      other.loadStepKg === this.loadStepKg
    );
  }
}
