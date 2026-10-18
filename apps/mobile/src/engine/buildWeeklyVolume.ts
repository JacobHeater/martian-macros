import type { CalendarDate } from '../domain/CalendarDate';
import type { Exercise } from '../domain/training/Exercise';
import { MuscleGroup } from '../domain/training/MuscleGroup';
import type { Workout } from '../domain/training/Workout';
import { countHardSets } from './countHardSets';
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
    if (age < 7) {
      unmappedCurrent += countHardSets(workout, byId, current);
    } else {
      unmappedPrevious += countHardSets(workout, byId, previous);
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
