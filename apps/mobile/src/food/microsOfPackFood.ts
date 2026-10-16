import { Micronutrients } from '../domain/food/micros/Micronutrients';
import type { CatalogFood } from '../foodCatalog/CatalogFood';

/** What a pack food states per 100 g of sodium and the micronutrients (MM-308); the rest unknown. */
export function microsOfPackFood(food: CatalogFood): Micronutrients {
  return new Micronutrients({ ...food.micros, sodium: food.sodiumMg });
}
