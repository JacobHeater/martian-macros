import { CookingFatKind } from './CookingFatKind';
import type { NutritionTotals } from './portion/NutritionTotals';
import type { PortionUnit } from './portion/PortionUnit';

const spoons = {
  none: undefined,
  teaspoon: 'teaspoon',
  tablespoon: 'tablespoon',
} as const satisfies Record<string, PortionUnit | undefined>;

/**
 * How much fat went into cooking a food (MM-152): none, a teaspoon or a
 * tablespoon of the person's usual fat (`CookingFatKind`). A teaspoon of oil
 * is about 4.5 g and 40 kcal, a tablespoon about 13.5 g and 120 kcal.
 */
export type CookingFat = keyof typeof spoons;

export const CookingFat = {
  values: Object.keys(spoons) as readonly CookingFat[],

  unit(fat: CookingFat): PortionUnit | undefined {
    return spoons[fat];
  },

  /** Grams of `kind` in this spoonful; 0 for none. */
  grams(fat: CookingFat, kind: CookingFatKind): number {
    if (fat === 'teaspoon') return CookingFatKind.teaspoonG(kind);
    if (fat === 'tablespoon') return CookingFatKind.tablespoonG(kind);
    return 0;
  },

  /** The spoonful as its own entry's numbers; undefined for none. */
  totals(fat: CookingFat, kind: CookingFatKind): NutritionTotals | undefined {
    if (fat === 'none') return undefined;
    return CookingFatKind.per100g(kind).times(CookingFat.grams(fat, kind) / 100);
  },
} as const;
