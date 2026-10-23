import type { FoodEntry } from '../../FoodEntry';

/** The first of `newestFirst` with each name, ignoring case (MM-596): each food as it was last logged. */
export function distinctByName(newestFirst: readonly FoodEntry[], limit: number): FoodEntry[] {
  const seen = new Set<string>();
  const distinct: FoodEntry[] = [];
  for (const entry of newestFirst) {
    const name = entry.name.toLowerCase();
    if (seen.has(name)) continue;
    seen.add(name);
    distinct.push(entry);
    if (distinct.length >= limit) break;
  }
  return distinct;
}
