import type { NutritionTotals } from '../portion/NutritionTotals';

/** Grams per millilitre of each component at about 20 °C (Choi and Okos, 1986). */
const water = 0.997;
const protein = 1.33;
const fat = 0.917;
const carbohydrate = 1.6;

/**
 * The density of a solid food worked out from what 100 g of it is made of
 * (MM-46): protein, fat and carbohydrate as stated, the rest taken as water.
 * Each part takes its own volume, so the food's density is the mass over the
 * summed volumes (the Choi and Okos mixture rule used in food engineering).
 *
 * It ignores air, so it is for a portion of something solid (a fillet, a
 * spread) and never for a heap of grains or berries. Undefined when the
 * stated parts are not a possible 100 g.
 */
export function compositionDensity(per100g: NutritionTotals): number | undefined {
  const solids = per100g.proteinG + per100g.fatG + per100g.carbsG;
  if (per100g.proteinG < 0 || per100g.fatG < 0 || per100g.carbsG < 0 || solids > 100) return undefined;
  const millilitres =
    (100 - solids) / water + per100g.proteinG / protein + per100g.fatG / fat + per100g.carbsG / carbohydrate;
  return 100 / millilitres;
}
