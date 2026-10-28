import type { CalendarDate } from '../../domain/CalendarDate';
import { roundHalfAwayFromZero } from '../../lang/roundHalfAwayFromZero';
import { CardioRule } from '../CardioRule';
import { hasHardSet } from '../hasHardSet';
import type { TrainingAnalysisInput } from './TrainingAnalysisInput';
import type { TrainingBrief } from './TrainingBrief';

/**
 * The training part of the coach's brief (MM-681), from what the training
 * analysis reads: the last seven days through `today`. Undefined under the
 * safeguards that forbid "train more" (MM-609's `restricted`): the coach
 * then says nothing of training.
 */
export function trainingBriefOf(
  input: Pick<TrainingAnalysisInput, 'setup' | 'workouts' | 'cardio' | 'steps' | 'cardioFloors' | 'safeguards'>,
  today: CalendarDate,
): TrainingBrief | undefined {
  if (input.safeguards.eatingDisorderHistory || input.safeguards.underEating) return undefined;
  const from = today.addDays(-6);
  const within = (date: CalendarDate) => !date.isBefore(from) && !date.isAfter(today);
  const sessions = input.workouts.filter((w) => !w.inProgress && !w.date.isAfter(today) && hasHardSet(w));
  const last = sessions.reduce<CalendarDate | undefined>((latest, w) => (latest === undefined || w.date.isAfter(latest) ? w.date : latest), undefined);
  const days = input.steps.filter((day) => within(day.date));
  const stepsSum = days.reduce((sum, day) => sum + day.steps, 0);
  const goal = input.setup.goalMode;
  return {
    goal,
    cardioHeld: goal === 'fatLoss' || goal === 'recomp',
    sessionsThisWeek: sessions.filter((w) => within(w.date)).length,
    sessionsTarget: input.setup.trainingDaysPerWeek,
    daysSinceSession: last === undefined ? undefined : last.daysUntil(today),
    wearableInUse: input.cardio.length > 0 || input.steps.length > 0,
    cardioMinutes: input.cardio.filter((s) => within(s.date)).reduce((sum, s) => sum + s.minutes, 0),
    cardioFloorMinutes: input.cardioFloors.minutesPerWeek ?? CardioRule.minutesPerWeek,
    stepsPerDay: days.length === 0 ? undefined : roundHalfAwayFromZero(stepsSum / days.length),
    stepsDays: days.length,
    stepsFloor: input.cardioFloors.stepsPerDay ?? CardioRule.stepsPerDay,
  };
}
