import type { ExerciseLoad } from '../domain/training/ExerciseLoad';
import type { WorkoutSet } from '../domain/training/WorkoutSet';

/**
 * A session that gave a lift its best estimated one-rep max so far
 * (MM-92): earned in training, and the one thing the app marks loudly.
 */
export interface PersonalRecord {
  readonly exerciseId: string;
  readonly name: string;

  /** The session's best estimate, and the best of every session before it. */
  readonly estimateKg: number;
  readonly previousBestKg: number;
  /** How the exercise is loaded, and the set that set the record (MM-118). */
  readonly load?: ExerciseLoad | undefined;
  readonly bestSet?: WorkoutSet | undefined;
}
