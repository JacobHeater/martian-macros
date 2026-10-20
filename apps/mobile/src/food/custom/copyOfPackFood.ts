import { CustomFood } from '../../domain/food/custom/CustomFood';
import { NutritionTotals } from '../../domain/food/portion/NutritionTotals';
import type { CatalogFood } from '../../foodCatalog/CatalogFood';
import type { CatalogServing } from '../../foodCatalog/CatalogServing';
import { microsOfPackFood } from '../microsOfPackFood';

/**
 * A database food as one of the person's own, not yet saved (MM-153, "Fix this
 * food"): its first serving (or 100 g), the figures scaled to it, and the
 * barcode it was scanned by, so the corrected copy is what that barcode finds
 * from then on. The database itself is never changed.
 */
export function copyOfPackFood(food: CatalogFood, servings: readonly CatalogServing[], barcode: string | undefined): CustomFood {
  const serving = servings[0];
  const grams = serving?.grams ?? 100;
  const f = grams / 100;
  const scaled = (value: number | undefined) => (value === undefined ? undefined : value * f);
  return new CustomFood({
    id: 0,
    name: food.brand === undefined ? food.name : `${food.name}, ${food.brand}`,
    kind: 'food',
    servingDescription: serving?.description ?? '100 g',
    servingGrams: grams,
    perServing: new NutritionTotals({ kcal: food.kcal * f, proteinG: food.proteinG * f, carbsG: food.carbsG * f, fatG: food.fatG * f }),
    barcode,
    fiberG: scaled(food.fiberG),
    sugarAlcoholsG: scaled(food.sugarAlcoholsG),
    micros: microsOfPackFood(food).times(f),
  });
}
