import type { FoodEntry } from '../../../domain/FoodEntry';
import type { Meal } from '../../../domain/Meal';
import { medianOf } from '../../trends/medianOf';
import type { CoachAdviceFood } from '../CoachAdviceFood';
import type { CoachAdviceReplacement } from '../CoachAdviceReplacement';
import { CoachAdviceRule } from '../CoachAdviceRule';
import { countsAsFood } from './countsAsFood';
import { FoodSignalRule } from './FoodSignalRule';
import { foodKeyOf } from './foodKeyOf';

const R = CoachAdviceRule;

/**
 * A meal or food the person logs in the same slot that would have done
 * (MM-617): logged there on at least 2 days of `history`, as a meal logged
 * as one (under its name) or a food on its own, at its usual time (the
 * median), saving a fifth of the calories or two fifths of the fat with
 * protein no lower than 60% of `food`'s. The most familiar first, then the
 * fewer calories. Undefined when none does.
 */
export function ownMealSwapOf(food: CoachAdviceFood, slot: Meal, history: readonly FoodEntry[]): CoachAdviceReplacement | undefined {
  const units = new Map<string, { name: string; days: Set<number>; at: Map<string, { kcal: number; proteinG: number; fatG: number; countable: number }> }>();
  for (const e of history) {
    if (e.meal !== slot) continue;
    const meal = e.loggedMeal;
    const key = meal === undefined ? foodKeyOf(e) : meal.name.trim().toLowerCase();
    if (key === food.key) continue;
    const instance = meal === undefined ? `${e.date.epochDay}:${e.id}` : `${e.date.epochDay}:${meal.key}`;
    let unit = units.get(key);
    if (unit === undefined) {
      unit = { name: (meal?.name ?? e.name).trim(), days: new Set(), at: new Map() };
      units.set(key, unit);
    }
    unit.days.add(e.date.epochDay);
    const time = unit.at.get(instance) ?? { kcal: 0, proteinG: 0, fatG: 0, countable: 0 };
    unit.at.set(instance, {
      kcal: time.kcal + e.kcal,
      proteinG: time.proteinG + e.proteinG,
      fatG: time.fatG + e.fatG,
      countable: time.countable + (countsAsFood(e) ? e.kcal : 0),
    });
  }
  const found: { replacement: CoachAdviceReplacement; days: number }[] = [];
  for (const unit of units.values()) {
    const readable = [...unit.at.values()].filter((t) => t.kcal > 0 && t.countable >= 0.75 * t.kcal);
    if (unit.days.size < FoodSignalRule.fitsMinimumDays || readable.length === 0) continue;
    const kcal = medianOf(readable.map((t) => t.kcal));
    const proteinG = medianOf(readable.map((t) => t.proteinG));
    const fatG = medianOf(readable.map((t) => t.fatG));
    const saves = kcal <= (1 - R.swapKcalSaving) * food.kcal || (food.fatG > 0 && fatG <= (1 - R.swapFatSaving) * food.fatG);
    if (!saves || proteinG < R.swapProteinKept * food.proteinG) continue;
    found.push({ replacement: { name: unit.name, kcal, proteinG, fatG, source: 'logged' }, days: unit.days.size });
  }
  found.sort((a, b) => b.days - a.days || (a.replacement.kcal ?? 0) - (b.replacement.kcal ?? 0));
  return found[0]?.replacement;
}
