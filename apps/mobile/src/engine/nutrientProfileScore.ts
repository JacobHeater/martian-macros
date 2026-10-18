import { FoodGradeRule } from './FoodGradeRule';

/** How many of `thresholds` the value is strictly above. */
const points = (value: number, thresholds: readonly number[]) => thresholds.filter((t) => value > t).length;

/**
 * The nutrient-profile score of a food per 100 g (MM-369): unfavourable
 * points for energy, sugars, saturated fat and salt, less favourable points
 * for fiber and, when the unfavourable points are under
 * `FoodGradeRule.proteinNotCountedFrom`, protein. Lower is better. Every
 * input must be known: the caller withholds a grade when one is not.
 */
export function nutrientProfileScore(per100g: {
  kcal: number;
  proteinG: number;
  sugarsG: number;
  saturatedFatG: number;
  sodiumMg: number;
  fiberG: number;
}): { negative: number; positive: number; score: number } {
  const negative =
    points(per100g.kcal * FoodGradeRule.kJPerKcal, FoodGradeRule.energyKJ) +
    points(per100g.sugarsG, FoodGradeRule.sugarsG) +
    points(per100g.saturatedFatG, FoodGradeRule.saturatedFatG) +
    points((per100g.sodiumMg * FoodGradeRule.saltPerSodium) / 1000, FoodGradeRule.saltG);
  const fiber = points(per100g.fiberG, FoodGradeRule.fiberG);
  const protein = negative >= FoodGradeRule.proteinNotCountedFrom ? 0 : points(per100g.proteinG, FoodGradeRule.proteinG);
  return { negative, positive: fiber + protein, score: negative - fiber - protein };
}
