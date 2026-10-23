import type { CalendarDate } from '../domain/CalendarDate';
import { FoodEntry } from '../domain/FoodEntry';
import type { Meal } from '../domain/Meal';
import { newMealKey } from './meal/newMealKey';

/**
 * Fresh copies of `entries` on `day`, for logging again (MM-47). Each keeps
 * its meal unless `meal` is given. They are ordinary new entries (id 0), so
 * editing a copy never touches the original. A copy has no time eaten. A
 * meal's foods are copied as a new meal (MM-587).
 */
export function entriesCopiedTo(
  day: CalendarDate,
  entries: readonly FoodEntry[],
  { meal }: { meal?: Meal } = {},
): FoodEntry[] {
  // Each meal copied is a new meal (MM-587): its foods share a new key, so the copy and the original stay apart.
  const keys = new Map<string, string>();
  const copiedMeal = (e: FoodEntry) => {
    if (e.loggedMeal === undefined) return undefined;
    const key = keys.get(e.loggedMeal.key) ?? newMealKey();
    keys.set(e.loggedMeal.key, key);
    return { key, name: e.loggedMeal.name };
  };
  return entries.map(
    (e) =>
      new FoodEntry({
        id: 0,
        date: day,
        meal: meal ?? e.meal,
        name: e.name,
        kcal: e.kcal,
        proteinG: e.proteinG,
        carbsG: e.carbsG,
        fatG: e.fatG,
        source: e.source,
        portion: e.portion,
        fiberG: e.fiberG,
        sugarAlcoholsG: e.sugarAlcoholsG,
        sodiumMg: e.sodiumMg,
        alcoholG: e.alcoholG,
        micros: e.micros,
        // When the original was eaten says nothing about when the copy was (MM-570): it has no time until one is given.
        eatenAt: undefined,
        loggedMeal: copiedMeal(e),
        evidence: e.evidence,
      }),
  );
}
