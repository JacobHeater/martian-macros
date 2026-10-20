import type { Preparation } from '../domain/food/portion/Preparation';
import type { CatalogFood } from '../foodCatalog/CatalogFood';

/** The state a pack food is in, as an entry records it (MM-151); undefined when the pack states none. */
export function preparationOf(food: CatalogFood): Preparation | undefined {
  return food.preparation === 'unspecified' ? undefined : food.preparation;
}
