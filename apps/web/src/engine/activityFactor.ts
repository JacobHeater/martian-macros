import type { DailyActivity } from '../domain/DailyActivity';
import { clamp } from '../lang/clamp';

const daily: Record<DailyActivity, number> = {
  seated: 1.2,
  light: 1.3,
  onFeet: 1.4,
  physicalJob: 1.5,
};

/**
 * The multiplier on resting energy for the starting expenditure estimate:
 * a factor for the day outside workouts, plus a step per weekly training day.
 *
 * This is a documented heuristic for the first days only; the estimator
 * replaces it with a measurement from logs and weigh-ins (MM-24). The table
 * and its reasoning are in requirements MM-164, and it is the first thing
 * the professional reviewer (MM-29) should see.
 */
export function activityFactor({
  dailyActivity,
  trainingDaysPerWeek,
}: {
  dailyActivity: DailyActivity;
  trainingDaysPerWeek: number;
}): number {
  return daily[dailyActivity] + 0.025 * clamp(trainingDaysPerWeek, 0, 7);
}
