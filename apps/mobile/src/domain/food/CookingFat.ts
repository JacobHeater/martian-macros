import { NutritionTotals } from './portion/NutritionTotals';
import type { PortionUnit } from './portion/PortionUnit';

const fats = {
  none: { unit: undefined, grams: 0 },
  teaspoon: { unit: 'teaspoon', grams: 4.5 },
  tablespoon: { unit: 'tablespoon', grams: 13.5 },
} as const satisfies Record<string, { unit: PortionUnit | undefined; grams: number }>;

/**
 * How much oil went into cooking a food (MM-152). A teaspoon of oil is about
 * 4.5 g and 40 kcal, a tablespoon about 13.5 g and 120 kcal, all of it fat.
 */
export type CookingFat = keyof typeof fats;

export const CookingFat = {
  values: Object.keys(fats) as readonly CookingFat[],

  unit(fat: CookingFat): PortionUnit | undefined {
    return fats[fat].unit;
  },

  grams(fat: CookingFat): number {
    return fats[fat].grams;
  },

  /** The oil as its own entry's numbers; undefined for none. */
  totals(fat: CookingFat): NutritionTotals | undefined {
    const { unit, grams } = fats[fat];
    return unit === undefined
      ? undefined
      : new NutritionTotals({ kcal: grams * 8.84, proteinG: 0, carbsG: 0, fatG: grams });
  },
} as const;
