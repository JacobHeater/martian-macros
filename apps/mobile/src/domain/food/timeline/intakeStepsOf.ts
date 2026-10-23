import type { IntakeStep } from './IntakeStep';
import type { TimedFood } from './TimedFood';
import { mealUsualMinute } from '../../mealUsualMinute';

/**
 * The day's running total as steps, in the order eaten (MM-571). Foods of
 * one meal at one minute are one step; a food without a recorded time stands
 * at its meal's usual time and its step says so. Foods with no calories add
 * no step.
 */
export function intakeStepsOf(foods: readonly TimedFood[]): IntakeStep[] {
  const byMoment = new Map<string, { minute: number; added: number; meal: TimedFood['meal']; approximate: boolean }>();
  for (const food of foods) {
    if (!(food.kcal > 0)) continue;
    const approximate = food.eatenAt === undefined;
    const minute = food.eatenAt ?? mealUsualMinute(food.meal);
    const key = `${minute}|${food.meal}|${approximate}`;
    const known = byMoment.get(key);
    if (known === undefined) byMoment.set(key, { minute, added: food.kcal, meal: food.meal, approximate });
    else known.added += food.kcal;
  }
  let total = 0;
  return [...byMoment.values()]
    .sort((a, b) => a.minute - b.minute)
    .map((step) => {
      total += step.added;
      return { ...step, total };
    });
}
