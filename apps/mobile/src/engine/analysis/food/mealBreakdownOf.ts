import type { FoodEntry } from '../../../domain/FoodEntry';
import { Meal } from '../../../domain/Meal';
import { CoachAdviceRule } from '../CoachAdviceRule';
import { countsAsFood } from './countsAsFood';
import type { MealBreakdown } from './MealBreakdown';

const R = CoachAdviceRule;
const sum = (entries: readonly FoodEntry[]) => entries.reduce((s, e) => s + e.kcal, 0);

/**
 * MM-617's meal breakdown of a day's entries: the meal slot with the most
 * calories, and in it the meal logged as one when it gives 70% of the
 * slot's calories (the buffet of 13 foods, its foods the entries that carry
 * its `loggedMeal` tag), or else the slot's foods.
 *
 * Each food is scored by the calories it gave beyond what its protein pays
 * for at the targets' density (`requiredPer100Kcal`), plus half its fat's
 * calories and 0.05 kcal for each mg of sodium: calories, fat and sodium
 * against the protein they brought. The top one is the worst; a second is
 * named at 80% of its score. The food to keep is the one, of a meal of
 * several, with the most protein per calorie and at least 10 g of it.
 * Undefined for a day with no calories.
 */
export function mealBreakdownOf(entries: readonly FoodEntry[], requiredPer100Kcal: number): MealBreakdown | undefined {
  let meal: Meal | undefined;
  let most = 0;
  for (const slot of Meal.values) {
    const kcal = sum(entries.filter((e) => e.meal === slot));
    if (kcal > most) {
      meal = slot;
      most = kcal;
    }
  }
  if (meal === undefined) return undefined;
  const inSlot = entries.filter((e) => e.meal === meal);
  const logged = new Map<string, FoodEntry[]>();
  for (const e of inSlot) {
    const key = e.loggedMeal?.key;
    if (key === undefined) continue;
    const list = logged.get(key);
    if (list === undefined) logged.set(key, [e]);
    else list.push(e);
  }
  const largest = [...logged.values()].sort((a, b) => sum(b) - sum(a))[0];
  const subject = largest !== undefined && sum(largest) >= R.mealSubjectShare * most ? largest : inSlot;
  const tag = subject === largest ? largest?.[0]?.loggedMeal : undefined;

  const score = (e: FoodEntry) =>
    Math.max(0, e.kcal - (requiredPer100Kcal > 0 ? (100 * e.proteinG) / requiredPer100Kcal : 0)) +
    R.worstFatWeight * 9 * e.fatG +
    R.worstSodiumWeight * (e.sodiumMg ?? 0);
  const named = subject.filter(countsAsFood).sort((a, b) => score(b) - score(a));
  const [first, second] = named;
  const worst =
    first === undefined ? [] : second !== undefined && score(second) >= R.secondWorstShare * score(first) ? [first, second] : [first];
  const keep =
    named.length < 2
      ? undefined
      : named
          .filter((e) => !worst.includes(e) && e.proteinG >= R.keepMinProteinG)
          .sort((a, b) => b.proteinG / b.kcal - a.proteinG / a.kcal)[0];
  return { meal, kcal: sum(subject), name: tag?.name.trim(), key: tag?.key, entries: subject, worst, keep };
}
