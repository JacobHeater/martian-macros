import type { CalendarDate } from '../domain/CalendarDate';
import { FoodEntry } from '../domain/FoodEntry';
import type { Meal } from '../domain/Meal';

/**
 * Fresh copies of `entries` on `day`, for logging again (MM-47). Each keeps
 * its meal unless `meal` is given. They are ordinary new entries (id 0), so
 * editing a copy never touches the original. A copy has no time eaten.
 */
export function entriesCopiedTo(
  day: CalendarDate,
  entries: readonly FoodEntry[],
  { meal }: { meal?: Meal } = {},
): FoodEntry[] {
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
      }),
  );
}
