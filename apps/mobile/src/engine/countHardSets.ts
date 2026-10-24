import type { Exercise } from '../domain/training/Exercise';
import type { MuscleGroup } from '../domain/training/MuscleGroup';
import type { Workout } from '../domain/training/Workout';
import { WorkoutSet } from '../domain/training/WorkoutSet';
import { ArgumentError } from '../lang/ArgumentError';
import { isHardSet } from './isHardSet';

/**
 * Adds the hard sets of `workout` to `totals`, by muscle group, as weekly
 * volume counts them (MM-78): a set is hard with 4 or fewer reps in reserve
 * or none recorded; it counts in full toward its exercise's main group and
 * half toward each other group it trains. Returns the hard sets of
 * exercises no longer known, which no group is given. A set with no reps
 * (an imported one whose platform gave none, MM-189) is evidence of nothing
 * and counts toward nothing until the user edits it (MM-613).
 */
export function countHardSets(
  workout: Workout,
  exercisesById: ReadonlyMap<string, Exercise>,
  totals: Map<MuscleGroup, number>,
): number {
  let unmapped = 0;
  for (const entry of workout.exercises) {
    let hardSets = 0;
    for (const set of entry.sets) {
      if (
        set.reps < 0 ||
        !Number.isFinite(set.loadKg) ||
        (set.rir !== undefined && (set.rir < 0 || set.rir > WorkoutSet.maxRir))
      ) {
        throw new ArgumentError('Invalid set: Invalid reps, load or RIR.');
      }
      if (isHardSet(set)) hardSets++;
    }
    const exercise = exercisesById.get(entry.exerciseId);
    if (exercise === undefined) {
      unmapped += hardSets;
      continue;
    }
    totals.set(exercise.primary, (totals.get(exercise.primary) ?? 0) + hardSets);
    for (const secondary of new Set(exercise.secondary)) {
      if (secondary === exercise.primary) continue;
      totals.set(secondary, (totals.get(secondary) ?? 0) + hardSets * 0.5);
    }
  }
  return unmapped;
}
