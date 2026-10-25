import { CalorieBand } from '../../CalorieBand';
import type { CoachAdvice } from '../CoachAdvice';
import { CoachAdviceRule } from '../CoachAdviceRule';
import type { CoachCause } from '../CoachCause';
import { adviceFoodOf } from './adviceFoodOf';
import type { FoodDay } from './FoodDay';
import { mealBreakdownOf } from './mealBreakdownOf';

const R = CoachAdviceRule;

/**
 * A span's calorie fix driven by one day (MM-617): the day that gave at
 * least half of the calories over target of `days` (each against its own
 * target), itself over the band, taken apart as 1d is (`mealBreakdownOf`).
 * Its worst one or two foods are skipped, each with the day it was eaten
 * and what that day would have been without it, and the meal is the cause.
 * Undefined when no one day drove it or no food of it can be named.
 */
export function dominantDayAdviceOf(days: readonly FoodDay[]): { readonly advice: CoachAdvice[]; readonly cause: CoachCause } | undefined {
  let total = 0;
  let top: { readonly day: FoodDay; readonly overKcal: number; readonly targetKcal: number } | undefined;
  for (const day of days) {
    const kcal = day.intake?.kcal;
    const targetKcal = day.kcalTarget;
    if (kcal === undefined || targetKcal === undefined) continue;
    const overKcal = kcal - targetKcal;
    if (!(overKcal > 0)) continue;
    total += overKcal;
    if (top === undefined || overKcal > top.overKcal) top = { day, overKcal, targetKcal };
  }
  if (top === undefined || top.overKcal < R.dominantDayShare * total) return undefined;
  const { day, overKcal, targetKcal } = top;
  const record = day.record;
  if (record === undefined || !(record.targets.kcal > 0) || day.intake === undefined) return undefined;
  if (day.intake.kcal <= new CalorieBand(targetKcal).highKcal) return undefined;
  const b = mealBreakdownOf(day.entries, (100 * record.targets.proteinG) / record.targets.kcal);
  const worst = b?.worst[0];
  if (b === undefined || worst === undefined) return undefined;
  const several = b.name !== undefined && b.entries.length >= R.spoonfulMinFoods;
  const advice = b.worst.map((e): CoachAdvice => ({
    kind: 'skip',
    food: adviceFoodOf(e.name, [e]),
    meal: b.meal,
    mealName: b.name,
    on: day.date,
    overKcal,
    withoutKcalOver: overKcal - e.kcal,
    keepFood: b.keep?.name.trim(),
    ...(several ? { orOneSpoonful: true } : {}),
  }));
  return {
    advice,
    cause: {
      meal: b.meal,
      mealName: b.name,
      mealKcal: b.kcal,
      mealFoods: b.entries.length,
      food: adviceFoodOf(worst.name, [worst]),
      on: day.date,
    },
  };
}
