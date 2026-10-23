import type { MealItemDraft } from '../../domain/food/meal/MealItemDraft';
import type { CatalogSearch } from '../../foodCatalog/CatalogSearch';
import { matchedMealItem } from './matchedMealItem';

/**
 * Each item of an analysed meal with the best numbers there are (MM-586):
 * the assistant's when it cited a specific source it verified; otherwise the
 * app's own food packs, looked up by the item's plain name and scaled to its
 * grams; otherwise the assistant's estimate, as it is. A search that fails
 * leaves the item as it is.
 */
export async function resolveMealItems(items: readonly MealItemDraft[], catalog: CatalogSearch | undefined): Promise<MealItemDraft[]> {
  return Promise.all(
    items.map(async (item) => {
      if (catalog === undefined || item.evidence.kind !== 'estimated' || item.grams === undefined || !(item.grams > 0)) return item;
      try {
        const [hit] = await catalog.search(item.lookup ?? item.name, { limit: 1 });
        return hit === undefined ? item : matchedMealItem(item, hit.food);
      } catch {
        return item;
      }
    }),
  );
}
