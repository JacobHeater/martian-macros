import type { DailyActivity } from '../domain/DailyActivity';
import { activityFactor } from './activityFactor';
import type { TdeePrior } from './TdeePrior';

/**
 * Starting TDEE before any adaptive data: resting energy times the activity
 * factor for the user's daily activity and training days, with a wide (15%)
 * uncertainty that the estimator quickly overrides.
 */
export function initialTdeePrior({
  bmrKcal,
  dailyActivity,
  trainingDaysPerWeek,
}: {
  bmrKcal: number;
  dailyActivity: DailyActivity;
  trainingDaysPerWeek: number;
}): TdeePrior {
  const kcal = bmrKcal * activityFactor({ dailyActivity, trainingDaysPerWeek });
  return { kcal, sigmaKcal: kcal * 0.15 };
}
