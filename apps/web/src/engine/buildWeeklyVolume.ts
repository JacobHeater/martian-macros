import type { CalendarDate } from '../domain/CalendarDate';
import type { Exercise } from '../domain/training/Exercise';
import { MuscleGroup } from '../domain/training/MuscleGroup';
import type { Workout } from '../domain/training/Workout';
import { WorkoutSet } from '../domain/training/WorkoutSet';
import { ArgumentError } from '../lang/ArgumentError';
import { MuscleVolume } from './MuscleVolume';
import type { WeeklyVolume } from './WeeklyVolume';

export function buildWeeklyVolume({
  workouts,
  exercises,
  today,
}: {
  workouts: Iterable<Workout>;
  exercises: Iterable<Exercise>;
  today: CalendarDate;
}): WeeklyVolume {
  const byId = new Map<string, Exercise>();
  for (const exercise of exercises) byId.set(exercise.id, exercise);
  const current = new Map<MuscleGroup, number>(MuscleGroup.values.map((group) => [group, 0]));
  const previous = new Map<MuscleGroup, number>(MuscleGroup.values.map((group) => [group, 0]));
  let unmappedCurrent = 0;
  let unmappedPrevious = 0;
  for (const workout of workouts) {
    const age = workout.date.daysUntil(today);
    if (workout.inProgress || age < 0 || age >= 14) continue;
    const totals = age < 7 ? current : previous;
    for (const entry of workout.exercises) {
      let hardSets = 0;
      for (const set of entry.sets) {
        if (
          set.reps < 1 ||
          !Number.isFinite(set.loadKg) ||
          (set.rir !== undefined && (set.rir < 0 || set.rir > WorkoutSet.maxRir))
        ) {
          throw new ArgumentError('Invalid set: Invalid reps, load or RIR.');
        }
        if (set.rir === undefined || set.rir <= 4) hardSets++;
      }
      const exercise = byId.get(entry.exerciseId);
      if (exercise === undefined) {
        if (age < 7) {
          unmappedCurrent += hardSets;
        } else {
          unmappedPrevious += hardSets;
        }
        continue;
      }
      totals.set(exercise.primary, (totals.get(exercise.primary) ?? 0) + hardSets);
      for (const secondary of new Set(exercise.secondary)) {
        if (secondary === exercise.primary) continue;
        totals.set(secondary, (totals.get(secondary) ?? 0) + hardSets * 0.5);
      }
    }
  }
  return {
    today,
    groups: MuscleGroup.values.map(
      (group) =>
        new MuscleVolume({
          group,
          currentSets: current.get(group) ?? 0,
          previousSets: previous.get(group) ?? 0,
        }),
    ),
    unmappedCurrentSets: unmappedCurrent,
    unmappedPreviousSets: unmappedPrevious,
  };
}
