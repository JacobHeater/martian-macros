import type { CalendarDate } from '../domain/CalendarDate';
import type { Workout } from '../domain/training/Workout';
import { Fmt } from '../format/Fmt';
import type { WorkoutGroup } from './WorkoutGroup';

/**
 * Groups finished workouts, newest first, as the Train list shows them
 * (MM-253, rule 3): the last seven days as "This week", the seven before
 * as "Last week", then one group per calendar month ("September 2026").
 * A group with nothing in it is left out, so the list keeps its shape
 * without empty headings.
 */
export function workoutGroups(finished: readonly Workout[], today: CalendarDate): WorkoutGroup[] {
  const sorted = [...finished].sort((a, b) => b.date.compareTo(a.date) || b.startedAt.getTime() - a.startedAt.getTime());
  const groups: WorkoutGroup[] = [];
  const add = (title: string, workout: Workout) => {
    const last = groups[groups.length - 1];
    if (last !== undefined && last.title === title) groups[groups.length - 1] = { title, workouts: [...last.workouts, workout] };
    else groups.push({ title, workouts: [workout] });
  };
  for (const workout of sorted) {
    const ago = workout.date.daysUntil(today);
    if (ago < 7) add('This week', workout);
    else if (ago < 14) add('Last week', workout);
    else add(Fmt.monthYear(workout.date), workout);
  }
  return groups;
}
