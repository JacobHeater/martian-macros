import type { FoodDraft } from '../domain/food/custom/FoodDraft';
import { foodAnalysisFormatName, foodAnalysisFormatVersion } from '../domain/food/custom/foodAnalysisFormat';
import { Micronutrient } from '../domain/food/micros/Micronutrient';

/** At most two decimals, so a scaled number reads as the assistant would write it. */
const rounded = (value: number | undefined) => (value === undefined ? undefined : Math.round(value * 100) / 100);

function foodJson(food: FoodDraft): Record<string, unknown> {
  const micros = Object.fromEntries(Micronutrient.values.map((n) => [Micronutrient.column(n), rounded(food.micros.of(n))]));
  return {
    name: food.name,
    brand: food.brand ?? null,
    lookup: food.lookup,
    group: food.group,
    serving: { description: food.servingDescription, grams: rounded(food.servingGrams) },
    barcode: food.barcode ?? null,
    per_100g: {
      kcal: rounded(food.kcal),
      protein_g: rounded(food.proteinG),
      carbs_g: rounded(food.carbsG),
      fat_g: rounded(food.fatG),
      fiber_g: rounded(food.fiberG),
      sugar_alcohols_g: rounded(food.sugarAlcoholsG),
      alcohol_g: rounded(food.alcoholG),
      ...micros,
    },
    ingredients: food.ingredients.map((line) => ({ name: line.name, grams: rounded(line.grams) })),
    source: { verified: food.evidence.kind === 'cited', citation: food.evidence.citation },
  };
}

/** `foods` in the format the prompt asks for (MM-709), so they can be handed back to the assistant as they stand. */
export function foodDraftJson(foods: readonly FoodDraft[]): string {
  return JSON.stringify({ format: foodAnalysisFormatName, version: foodAnalysisFormatVersion, foods: foods.map(foodJson) }, null, 2);
}
