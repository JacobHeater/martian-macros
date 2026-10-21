import type { CalendarDate } from '../domain/CalendarDate';
import type { Workout } from '../domain/training/Workout';
import { WeekShape } from '../domain/WeekShape';

/** Four weeks back from today, not counting today. */
const lookBackDays = 28;

/**
 * The weekdays the user usually trains on, for the week shape's "training
 * days higher" (MM-124): each weekday with a finished workout in at least two
 * of the last four weeks, the most trained first, at most
 * `WeekShape.maxHigherDays`, then in weekday order. Empty when there is no
 * such day.
 */
export function usualTrainingWeekdays({ workouts, today }: { workouts: readonly Workout[]; today: CalendarDate }): number[] {
  const days = new Map<number, Set<number>>();
  for (const workout of workouts) {
    const ago = workout.date.daysUntil(today);
    if (workout.inProgress || ago < 1 || ago > lookBackDays) continue;
    const trained = days.get(workout.date.weekday) ?? new Set<number>();
    trained.add(workout.date.epochDay);
    days.set(workout.date.weekday, trained);
  }
  return [...days.entries()]
    .filter(([, trained]) => trained.size >= 2)
    .sort(([a, x], [b, y]) => y.size - x.size || a - b)
    .slice(0, WeekShape.maxHigherDays)
    .map(([weekday]) => weekday)
    .sort((a, b) => a - b);
}
