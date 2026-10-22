import type { NutritionTotals } from '../portion/NutritionTotals';

/** Grams per millilitre of each component at 20 °C (Choi and Okos, 1986). */
const water = 0.997;
// Choi and Okos: 1329.9 - 0.5184 T kg/m³, 1.32 at 20 °C.
const protein = 1.32;
const fat = 0.917;
const carbohydrate = 1.6;

/** More water than this in 100 g, in grams, and the food is moist enough to have no air in it. */
const moistWaterG = 50;

/**
 * The density of a solid food worked out from what 100 g of it is made of
 * (MM-46): protein, fat and carbohydrate as stated, the rest taken as water.
 * Each part takes its own volume, so the food's density is the mass over the
 * summed volumes (the Choi and Okos mixture rule used in food engineering).
 *
 * It ignores air, so it is only for a food with none to speak of: a moist
 * one (more than half water: meat, fish, cooked foods) or one mostly fat (a
 * spread, butter, oil; fat outweighing protein and carbohydrate together).
 * A dry, porous food (crisps, bread, crackers) is mostly air by volume, and
 * the rule made it three to ten times too heavy; it is undefined for one,
 * so the portion's default stands. Undefined too when the stated parts are
 * not a possible 100 g.
 */
export function compositionDensity(per100g: NutritionTotals): number | undefined {
  const solids = per100g.proteinG + per100g.fatG + per100g.carbsG;
  if (per100g.proteinG < 0 || per100g.fatG < 0 || per100g.carbsG < 0 || solids > 100) return undefined;
  const waterG = 100 - solids;
  const fatDominates = per100g.fatG > per100g.proteinG + per100g.carbsG;
  if (!(waterG > moistWaterG) && !fatDominates) return undefined;
  const millilitres = waterG / water + per100g.proteinG / protein + per100g.fatG / fat + per100g.carbsG / carbohydrate;
  return 100 / millilitres;
}
