import type { MealItemDraft } from '../../domain/food/meal/MealItemDraft';
import { Micronutrient } from '../../domain/food/micros/Micronutrient';
import { Micronutrients } from '../../domain/food/micros/Micronutrients';
import type { CatalogFood } from '../../foodCatalog/CatalogFood';
import { foodSourceLabel } from '../../format/foodSourceLabel';
import { microsOfPackFood } from '../microsOfPackFood';

/**
 * `item` with the numbers of the pack food it matched (MM-586), scaled to
 * its grams. A number the pack does not state keeps the assistant's, so the
 * item still has what its grade needs; the line under it names the food.
 */
export function matchedMealItem(item: MealItemDraft, food: CatalogFood): MealItemDraft {
  const grams = item.grams ?? 0;
  const factor = grams / 100;
  const pack = microsOfPackFood(food);
  const micros: Partial<Record<Micronutrient, number>> = {};
  for (const n of Micronutrient.values) {
    const stated = pack.of(n);
    const value = stated === undefined ? item.micros.of(n) : stated * factor;
    if (value !== undefined) micros[n] = value;
  }
  const brand = food.brand === undefined ? '' : `, ${food.brand}`;
  return {
    ...item,
    kcal: food.kcal * factor,
    proteinG: food.proteinG * factor,
    carbsG: food.carbsG * factor,
    fatG: food.fatG * factor,
    fiberG: food.fiberG === undefined ? item.fiberG : food.fiberG * factor,
    micros: new Micronutrients(micros),
    evidence: { kind: 'matched', citation: `${food.name}${brand} (${foodSourceLabel(food)})` },
  };
}
