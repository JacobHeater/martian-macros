import type { FoodDraft } from '../../domain/food/custom/FoodDraft';
import { Micronutrient } from '../../domain/food/micros/Micronutrient';
import { Micronutrients } from '../../domain/food/micros/Micronutrients';
import type { CatalogFood } from '../../foodCatalog/CatalogFood';
import { foodSourceLabel } from '../../format/foodSourceLabel';
import { microsOfPackFood } from '../microsOfPackFood';

/**
 * `draft` with the per-100 g numbers of the pack food it matched (MM-709),
 * as `matchedMealItem` does for a meal's food. A number the pack does not
 * state keeps the assistant's, so the food still has every field; the pack
 * food's group is taken when the assistant gave none; the line under it
 * names the food.
 */
export function matchedFoodDraft(draft: FoodDraft, food: CatalogFood): FoodDraft {
  const pack = microsOfPackFood(food);
  const micros: Partial<Record<Micronutrient, number>> = {};
  for (const n of Micronutrient.values) {
    const value = pack.of(n) ?? draft.micros.of(n);
    if (value !== undefined) micros[n] = value;
  }
  const brand = food.brand === undefined ? '' : `, ${food.brand}`;
  return {
    ...draft,
    group: draft.group ?? food.group,
    kcal: food.kcal,
    proteinG: food.proteinG,
    carbsG: food.carbsG,
    fatG: food.fatG,
    fiberG: food.fiberG ?? draft.fiberG,
    sugarAlcoholsG: food.sugarAlcoholsG ?? draft.sugarAlcoholsG,
    alcoholG: food.alcoholG ?? draft.alcoholG,
    micros: new Micronutrients(micros),
    evidence: { kind: 'matched', citation: `${food.name}${brand} (${foodSourceLabel(food)})` },
  };
}
