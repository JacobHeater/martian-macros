import type { FoodEntry } from '../../../domain/FoodEntry';
import { FoodInsightRule } from '../../FoodInsightRule';
import { countsAsFood } from './countsAsFood';
import type { DayUnit } from './DayUnit';
import { foodKeyOf } from './foodKeyOf';

/**
 * A day's entries as the coach's orders name them (MM-617): each meal logged
 * as one (MM-587) is one unit under its name, its figures the sum of its
 * foods, unless it is `split` (the logged meal the breakdown took apart, by
 * key), whose foods are units of their own. A food logged on its own is a
 * unit. Only what may be named is kept: a food that `countsAsFood`, and a
 * meal whose foods that do explain 75% of its calories. Most calories first.
 */
export function dayUnitsOf(entries: readonly FoodEntry[], split: string | undefined): DayUnit[] {
  const units: DayUnit[] = [];
  const meals = new Map<string, FoodEntry[]>();
  for (const e of entries) {
    const tag = e.loggedMeal;
    if (tag === undefined || tag.key === split) {
      if (!countsAsFood(e)) continue;
      units.push({
        food: { key: foodKeyOf(e), name: e.name.trim(), kcal: e.kcal, fatG: e.fatG, proteinG: e.proteinG, sodiumMg: e.sodiumMg },
        carbsG: e.carbsG,
        meal: e.meal,
        mealName: tag?.name.trim(),
        entries: [e],
      });
      continue;
    }
    const list = meals.get(tag.key);
    if (list === undefined) meals.set(tag.key, [e]);
    else list.push(e);
  }
  for (const list of meals.values()) {
    const first = list[0];
    if (first?.loggedMeal === undefined) continue;
    const sum = (of: (e: FoodEntry) => number) => list.reduce((s, e) => s + of(e), 0);
    const kcal = sum((e) => e.kcal);
    const countable = sum((e) => (countsAsFood(e) ? e.kcal : 0));
    if (!(kcal > 0) || countable < FoodInsightRule.knownMacrosShare * kcal) continue;
    const sodium = list.every((e) => e.sodiumMg === undefined) ? undefined : sum((e) => e.sodiumMg ?? 0);
    const name = first.loggedMeal.name.trim();
    units.push({
      food: { key: name.toLowerCase(), name, kcal, fatG: sum((e) => e.fatG), proteinG: sum((e) => e.proteinG), sodiumMg: sodium, meal: true },
      carbsG: sum((e) => e.carbsG),
      meal: first.meal,
      mealName: undefined,
      entries: list,
    });
  }
  return units.sort((a, b) => b.food.kcal - a.food.kcal);
}
