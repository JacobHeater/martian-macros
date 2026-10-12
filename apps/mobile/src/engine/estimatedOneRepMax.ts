import type { ExerciseLoad } from '../domain/training/ExerciseLoad';
import { WorkoutSet } from '../domain/training/WorkoutSet';
import { ArgumentError } from '../lang/ArgumentError';

/**
 * Epley with effective reps (reps + RIR). Undefined means insufficient
 * evidence, not zero strength. Bodyweight exercises use total resistance,
 * not added load.
 */
export function estimatedOneRepMax(
  set: WorkoutSet,
  { load, bodyweightKg }: { load: ExerciseLoad; bodyweightKg?: number | undefined },
): number | undefined {
  if (
    set.reps < 1 ||
    !Number.isFinite(set.loadKg) ||
    (set.rir !== undefined && (set.rir < 0 || set.rir > WorkoutSet.maxRir))
  ) {
    throw new ArgumentError('Invalid set: Invalid reps, load or RIR.');
  }
  if (bodyweightKg !== undefined && (!Number.isFinite(bodyweightKg) || bodyweightKg <= 0)) {
    throw new ArgumentError(`Invalid bodyweightKg (${bodyweightKg}): Must be positive and finite.`);
  }
  const effectiveReps = set.reps + (set.rir ?? 0);
  if (effectiveReps > 12 || set.rir === WorkoutSet.maxRir) return undefined;
  if (load === 'bodyweight' && bodyweightKg === undefined) return undefined;
  const resistance = set.loadKg + (load === 'bodyweight' ? (bodyweightKg as number) : 0);
  if (resistance <= 0) return undefined;
  return resistance * (1 + effectiveReps / 30);
}
