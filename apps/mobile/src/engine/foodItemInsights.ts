import type { FoodEntry } from '../domain/FoodEntry';
import { usualServing } from '../domain/food/portion/usualServing';
import { FoodInsightRule } from './FoodInsightRule';
import type { ItemInsight } from './ItemInsight';

/** How much of an entry's energy its macros account for; undefined with no calories. */
function knownShare(entry: FoodEntry): number | undefined {
  if (entry.kcal <= 0) return undefined;
  return (4 * entry.proteinG + 4 * entry.carbsG + 9 * entry.fatG + entry.alcoholKcal) / entry.kcal;
}

/**
 * The food area's inline insights (MM-365) for logged entries, each about
 * the item alone (MM-362): "mostly fat", "light on protein" and the portion
 * check. An estimate (`quickAdd`) gets none: its macros are guesses. The
 * composition lines need the macros to explain the energy, so a food typed
 * with calories alone says nothing (the panel's NU-4).
 */
export function foodItemInsights({
  entries,
  proteinMinimumG,
}: {
  entries: readonly FoodEntry[];
  /** The protein minimum in force, or none: without one nothing is light on protein. */
  proteinMinimumG: number | undefined;
}): ItemInsight[] {
  const found: ItemInsight[] = [];
  for (const entry of entries) {
    if (entry.source === 'quickAdd') continue;
    const anchor = { kind: 'foodEntry', id: `${entry.id}` } as const;
    const base = { anchor, subject: entry.name, basis: 'item' } as const;
    const known = knownShare(entry);
    if (known !== undefined && known >= FoodInsightRule.knownMacrosShare) {
      const fatShare = Math.min(1, (9 * entry.fatG) / entry.kcal);
      const proteinShare = (4 * entry.proteinG) / entry.kcal;
      const alcoholShare = entry.alcoholKcal / entry.kcal;
      if (
        entry.kcal >= FoodInsightRule.mostlyFatMinKcal &&
        fatShare >= FoodInsightRule.mostlyFatShare &&
        proteinShare < FoodInsightRule.proteinDenseShare
      ) {
        found.push({ ...base, kind: 'mostlyFat', figures: { kcal: entry.kcal, fatG: entry.fatG, proteinG: entry.proteinG, fatShare } });
      }
      if (
        proteinMinimumG !== undefined &&
        entry.kcal >= FoodInsightRule.lightOnProteinMinKcal &&
        proteinShare < FoodInsightRule.lightOnProteinShare &&
        alcoholShare < FoodInsightRule.alcoholShare
      ) {
        found.push({ ...base, kind: 'lightOnProtein', figures: { kcal: entry.kcal, proteinG: entry.proteinG, proteinMinimumG } });
      }
    }
    const usual = usualServing(entry);
    if (
      usual !== undefined &&
      ((usual.servings >= FoodInsightRule.largePortionRatio && entry.kcal >= FoodInsightRule.largePortionMinKcal) ||
        usual.servings >= FoodInsightRule.largePortionMaxServings)
    ) {
      found.push({
        ...base,
        kind: 'portionCheck',
        figures: { kcal: entry.kcal, servings: usual.servings, ...(usual.servingGrams === undefined ? {} : { servingGrams: usual.servingGrams }) },
      });
    }
  }
  return found;
}
