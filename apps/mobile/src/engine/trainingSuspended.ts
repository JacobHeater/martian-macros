import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import type { Workout } from '../domain/training/Workout';
import type { UserSetup } from '../domain/UserSetup';
import { hasHardSet } from './hasHardSet';
import { TrainingRule } from './TrainingRule';

/**
 * Whether a lean-gain surplus is suspended for want of training (MM-134),
 * pause or no pause: the training-days setting is zero, or no workout has
 * been finished in the last `suspendAfterDays` days of a log in use. A
 * workout counts only with a hard set, as in `assessTrainingLapse` (MM-609).
 */
export function trainingSuspended({
  setup,
  workouts,
  today,
}: {
  setup: UserSetup;
  workouts: readonly Workout[];
  pauses?: readonly Pause[];
  today: CalendarDate;
}): boolean {
  if (setup.goalMode !== 'leanGain') return false;
  if (setup.trainingDaysPerWeek === 0) return true;
  const finished = workouts.filter((w) => !w.inProgress && !w.date.isAfter(today) && hasHardSet(w));
  if (finished.length === 0) return false;
  const last = finished.reduce((a, b) => (b.date.isAfter(a.date) ? b : a));
  return last.date.daysUntil(today) >= TrainingRule.suspendAfterDays;
}
