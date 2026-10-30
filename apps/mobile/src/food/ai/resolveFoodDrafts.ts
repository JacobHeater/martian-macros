import type { FoodDraft } from '../../domain/food/custom/FoodDraft';
import type { CatalogSearch } from '../../foodCatalog/CatalogSearch';
import { matchedFoodDraft } from './matchedFoodDraft';

/**
 * Each food of an answer with the best numbers there are (MM-709), as
 * `resolveMealItems` does for a meal: the assistant's when it cited a
 * specific source it verified; otherwise the app's own food packs, looked
 * up by the food's plain name; otherwise the assistant's estimate, as it
 * is. A pack food stated per 100 mL is not taken for a food saved by
 * weight. A search that fails leaves the food as it is.
 */
export async function resolveFoodDrafts(foods: readonly FoodDraft[], catalog: CatalogSearch | undefined): Promise<FoodDraft[]> {
  return Promise.all(
    foods.map(async (food) => {
      if (catalog === undefined || food.evidence.kind !== 'estimated') return food;
      try {
        const [hit] = await catalog.search(food.lookup ?? food.name, { limit: 1 });
        return hit === undefined || hit.food.basis === 'per100ml' ? food : matchedFoodDraft(food, hit.food);
      } catch {
        return food;
      }
    }),
  );
}
