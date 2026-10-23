import type { FoodEntry } from '../../FoodEntry';
import { LoggedMeal } from './LoggedMeal';

/**
 * A slot's entries as the rows the day shows (MM-587): a food logged on its
 * own is its own row, and the foods of one meal are one row, where its
 * first food was.
 */
export function foodLogRows(entries: readonly FoodEntry[]): (FoodEntry | LoggedMeal)[] {
  const meals = new Map<string, FoodEntry[]>();
  for (const entry of entries) {
    const key = entry.loggedMeal?.key;
    if (key !== undefined) meals.set(key, [...(meals.get(key) ?? []), entry]);
  }
  const rows: (FoodEntry | LoggedMeal)[] = [];
  const placed = new Set<string>();
  for (const entry of entries) {
    const key = entry.loggedMeal?.key;
    if (key === undefined) rows.push(entry);
    else if (!placed.has(key)) {
      placed.add(key);
      rows.push(new LoggedMeal(meals.get(key) as FoodEntry[]));
    }
  }
  return rows;
}
