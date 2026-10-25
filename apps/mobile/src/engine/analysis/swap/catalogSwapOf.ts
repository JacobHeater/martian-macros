import { compareStrings } from '../../../lang/compareStrings';
import type { CoachAdviceReplacement } from '../CoachAdviceReplacement';
import type { CoachTrade } from '../CoachTrade';
import { foodTagsOf } from '../language/foodTagsOf';
import { betterPreparation } from './betterPreparation';
import { nameTermsOf } from './nameTermsOf';
import { nearestByName } from './nearestByName';
import { proteinSourceWords } from './proteinSourceWords';
import { readableFood } from './readableFood';
import type { SwapInput } from './SwapInput';
import type { SwapLimits } from './SwapLimits';
import { swapAllowed } from './swapAllowed';
import { sweetForMeal } from './sweetForMeal';
import { tradeGainOf } from './tradeGainOf';
import { tradeTargetFor } from './tradeTargetFor';
import { unbalancedFood } from './unbalancedFood';

/** The motives a catalog food may be better for: any one of them is enough. */
const motives: readonly CoachTrade['motive'][] = ['fat', 'calories', 'protein', 'sodium'];

/**
 * The second step of a swap (MM-617): the catalog's nearest better food in
 * the food's group (MM-616). Candidates are the group's foods ranked by name
 * (`nearestByName`, TF-IDF cosine over the group), kept only when:
 * - at their default serving they are in MM-607's band of calories against the food's portion (`tradeTargetFor`);
 * - their figures are readable, and better for a motive by MM-607's matching rules (`tradeGainOf`), protein left out
 *   under kidney disease;
 * - they are neither mostly fat nor light on protein;
 * - their tags say a better preparation (`betterPreparation`), and no dessert, candy or snack food takes a meal
 *   food's place (`sweetForMeal`);
 * - the limits allow them (`swapAllowed`).
 * The food's protein source is kept where it has one (chicken for chicken), then the nearest name wins, then the
 * fewer calories, then the name. Undefined without a catalog, without the food's group, or when none qualifies.
 */
export function catalogSwapOf(input: SwapInput, limits: SwapLimits): CoachAdviceReplacement | undefined {
  const { catalog, group, food } = input;
  if (catalog === undefined || group === undefined || !(food.kcal > 0)) return undefined;
  const target = tradeTargetFor(input.goal, food.kcal);
  const x = { kcal: food.kcal, proteinG: food.proteinG, fatG: food.fatG, sodiumMg: food.sodiumMg, grams: undefined };
  const allowedMotives = motives.filter((m) => !(m === 'protein' && limits.noProteinGain));
  const foodTags = foodTagsOf(food.name);
  const sources = new Set(nameTermsOf(food.name).filter((t) => proteinSourceWords.has(t)));
  const key = food.name.trim().toLowerCase();
  const kept = nearestByName(catalog.nameIndexIn(group), food.name)
    .filter(({ food: { food: y, tags } }) => {
      if (y.name.trim().toLowerCase() === key) return false;
      if (y.kcal < target.minKcal || (target.maxKcal !== undefined && y.kcal > target.maxKcal)) return false;
      if (!readableFood(y) || unbalancedFood(y)) return false;
      const yFigures = { kcal: y.kcal, proteinG: y.proteinG, fatG: y.fatG, sodiumMg: y.sodiumMg, grams: undefined };
      if (!allowedMotives.some((m) => tradeGainOf(m, x, yFigures) !== undefined)) return false;
      if (!betterPreparation(foodTags, tags) || sweetForMeal(foodTags, tags)) return false;
      return swapAllowed(food, y, limits);
    })
    .map((match) => ({ match, sameSource: match.food.terms.some((t) => sources.has(t)) }));
  kept.sort(
    (a, b) =>
      Number(b.sameSource) - Number(a.sameSource) ||
      b.match.similarity - a.match.similarity ||
      a.match.food.food.kcal - b.match.food.food.kcal ||
      compareStrings(a.match.food.food.name, b.match.food.food.name),
  );
  const best = kept[0]?.match.food.food;
  if (best === undefined) return undefined;
  return { name: best.name, kcal: best.kcal, proteinG: best.proteinG, fatG: best.fatG, source: 'catalog' };
}
