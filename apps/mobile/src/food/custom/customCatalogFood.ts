import type { CustomFood } from '../../domain/food/custom/CustomFood';
import { CatalogFood } from '../../foodCatalog/CatalogFood';
import { PackMicronutrient } from '../../foodCatalog/PackMicronutrient';

/**
 * A saved food shown as the catalog food the amount step and trust mark
 * understand (MM-45). Per-100 g numbers follow from its serving weight;
 * with no serving weight the figures are per serving and only servings are
 * offered.
 */
export function customCatalogFood(food: CustomFood): CatalogFood {
  const grams = food.servingGrams;
  const scale = grams === undefined ? 1.0 : 100 / grams;
  const perHundred = (perServing: number | undefined) => (perServing === undefined ? undefined : perServing * scale);
  return new CatalogFood({
    id: food.id,
    packId: 'custom',
    name: food.name,
    kcal: food.perServing.kcal * scale,
    proteinG: food.perServing.proteinG * scale,
    carbsG: food.perServing.carbsG * scale,
    fatG: food.perServing.fatG * scale,
    // Fiber, sodium and the micronutrients follow the same scale (MM-309).
    fiberG: perHundred(food.fiberG),
    sugarAlcoholsG: perHundred(food.sugarAlcoholsG),
    sodiumMg: perHundred(food.micros.of('sodium')),
    micros: Object.fromEntries(
      PackMicronutrient.values
        .map((n) => [n, perHundred(food.micros.of(n))] as const)
        .filter(([, value]) => value !== undefined),
    ),
    source: 'user',
    tier: 'label',
    tierReason: 'Entered by you.',
  });
}
