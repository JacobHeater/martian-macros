import type { FoodEntry } from '../../FoodEntry';
import type { Meal } from '../../Meal';

/**
 * How many times each food was logged at `meal` among `entries` (MM-639),
 * by name, ignoring case. A logged meal (MM-587) counts once each time it
 * was logged, under its own name, not its foods'.
 */
export function timesLoggedAt(meal: Meal, entries: readonly FoodEntry[]): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  const mealsCounted = new Set<string>();
  for (const entry of entries) {
    if (entry.meal !== meal) continue;
    let name = entry.name;
    if (entry.loggedMeal !== undefined) {
      if (mealsCounted.has(entry.loggedMeal.key)) continue;
      mealsCounted.add(entry.loggedMeal.key);
      name = entry.loggedMeal.name;
    }
    const key = name.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}
