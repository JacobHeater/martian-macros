import type { CalendarDate } from '../domain/CalendarDate';
import type { Pause } from '../domain/Pause';
import type { Workout } from '../domain/training/Workout';
import type { UserSetup } from '../domain/UserSetup';
import { hasHardSet } from './hasHardSet';
import { pauseOn } from './pauseOn';
import type { TrainingLapse } from './TrainingLapse';
import { TrainingRule } from './TrainingRule';

/**
 * Whether training has lapsed against a goal that needs it (MM-134).
 *
 * The training log is in use once a workout has been finished. A workout
 * counts only with a hard set (MM-609): an imported session with no sets is
 * not training. On lean
 * gain, no workout for `suspendAfterDays`, or a training-days setting of
 * zero, suspends the surplus; on any deficit or gain, no workout for
 * `noticeAfterDays` is a notice and nothing more. A pause (MM-148) is
 * legitimate: no notice during one, and the suspension stands without
 * comment. Maintenance needs no training to be maintenance.
 */
export function assessTrainingLapse({
  setup,
  workouts,
  pauses = [],
  today,
}: {
  setup: UserSetup;
  workouts: readonly Workout[];
  pauses?: readonly Pause[];
  today: CalendarDate;
}): TrainingLapse {
  const goal = setup.goalMode;
  const finished = workouts.filter((w) => !w.inProgress && !w.date.isAfter(today) && hasHardSet(w));
  let lastTrainedOn: CalendarDate | undefined;
  for (const w of finished) if (lastTrainedOn === undefined || w.date.isAfter(lastTrainedOn)) lastTrainedOn = w.date;
  const daysSince = lastTrainedOn?.daysUntil(today);
  const noTrainingDays = setup.trainingDaysPerWeek === 0;
  const none: TrainingLapse = { kind: 'none', goal, daysSince, lastTrainedOn, noTrainingDays };
  if (goal === 'maintenance') return none;
  const paused = pauseOn(pauses, today) !== undefined;
  const suspend = goal === 'leanGain' && (noTrainingDays || (daysSince !== undefined && daysSince >= TrainingRule.suspendAfterDays));
  if (suspend) return { ...none, kind: paused ? 'none' : 'suspend' };
  if (!paused && daysSince !== undefined && daysSince >= TrainingRule.noticeAfterDays) return { ...none, kind: 'notice' };
  return none;
}
