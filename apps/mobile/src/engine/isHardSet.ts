import type { WorkoutSet } from '../domain/training/WorkoutSet';

/**
 * Whether a set is hard as weekly volume counts it (MM-78): 4 or fewer reps
 * in reserve, or none recorded. A set with no reps (imported without them,
 * MM-189) is evidence of nothing and is never hard (MM-613).
 */
export function isHardSet(set: WorkoutSet): boolean {
  return set.reps > 0 && (set.rir === undefined || set.rir <= 4);
}
