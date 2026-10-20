import { NutritionTotals } from './portion/NutritionTotals';

interface Facts {
  /** Per 100 g, as USDA SR Legacy states the fat. */
  readonly per100g: NutritionTotals;
  /** Grams in a level teaspoon and tablespoon of it. */
  readonly teaspoonG: number;
  readonly tablespoonG: number;
}

const facts = {
  oil: { per100g: new NutritionTotals({ kcal: 884, proteinG: 0, carbsG: 0, fatG: 100 }), teaspoonG: 4.5, tablespoonG: 13.5 },
  butter: { per100g: new NutritionTotals({ kcal: 717, proteinG: 0.85, carbsG: 0.06, fatG: 81.1 }), teaspoonG: 4.7, tablespoonG: 14.2 },
  ghee: { per100g: new NutritionTotals({ kcal: 876, proteinG: 0.28, carbsG: 0, fatG: 99.5 }), teaspoonG: 4.3, tablespoonG: 12.8 },
  coconutOil: { per100g: new NutritionTotals({ kcal: 892, proteinG: 0, carbsG: 0, fatG: 99.1 }), teaspoonG: 4.5, tablespoonG: 13.6 },
} as const satisfies Record<string, Facts>;

/**
 * The fat a person usually cooks with (MM-152): oil (olive or vegetable,
 * alike per gram), butter, ghee or coconut oil. The one chosen is remembered
 * as the usual, so "Cooked with oil?" adds the right fat in one tap.
 */
export type CookingFatKind = keyof typeof facts;

export const CookingFatKind = {
  values: Object.keys(facts) as readonly CookingFatKind[],

  per100g: (kind: CookingFatKind): NutritionTotals => facts[kind].per100g,
  teaspoonG: (kind: CookingFatKind): number => facts[kind].teaspoonG,
  tablespoonG: (kind: CookingFatKind): number => facts[kind].tablespoonG,
} as const;
