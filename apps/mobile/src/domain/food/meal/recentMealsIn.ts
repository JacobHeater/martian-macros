import type { FoodEntry } from '../../FoodEntry';
import { LoggedMeal } from './LoggedMeal';

/**
 * The most recently logged distinct meals in `newestFirst` (MM-587): by
 * name, ignoring case, each as it was last logged, newest first, at most
 * `limit`.
 */
export function recentMealsIn(newestFirst: readonly FoodEntry[], limit: number): LoggedMeal[] {
  const byKey = new Map<string, FoodEntry[]>();
  for (const entry of newestFirst) {
    const key = entry.loggedMeal?.key;
    if (key !== undefined) byKey.set(key, [entry, ...(byKey.get(key) ?? [])]);
  }
  const seen = new Set<string>();
  const meals: LoggedMeal[] = [];
  for (const items of byKey.values()) {
    const meal = new LoggedMeal([...items].sort((a, b) => a.id - b.id));
    const name = meal.name.toLowerCase();
    if (seen.has(name)) continue;
    seen.add(name);
    meals.push(meal);
  }
  return meals.slice(0, Math.max(0, limit));
}
