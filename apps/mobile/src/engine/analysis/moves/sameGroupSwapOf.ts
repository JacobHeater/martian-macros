import type { Caution } from '../../../domain/Caution';
import type { FoodEntry } from '../../../domain/FoodEntry';
import type { FoodGroup } from '../../../domain/food/FoodGroup';
import type { GoalMode } from '../../../domain/GoalMode';
import type { Meal } from '../../../domain/Meal';
import type { InsightSafeguards } from '../../InsightSafeguards';
import { adviceFoodOf } from '../food/adviceFoodOf';
import { foodGroupOf } from '../food/foodGroupOf';
import { foodKeyOf } from '../food/foodKeyOf';
import { isSameFoodName } from '../food/isSameFoodName';
import { tableSwapOf } from '../food/tableSwapOf';
import { catalogSwapOf } from '../swap/catalogSwapOf';
import { ownSwapOf } from '../swap/ownSwapOf';
import type { SwapInput } from '../swap/SwapInput';
import { swapLimitsOf } from '../swap/swapLimitsOf';
import type { TradeCatalog } from '../TradeCatalog';
import type { MealAfter } from './MealAfter';
import { mealAfterOf } from './mealAfterOf';
import type { MealMove } from './MealMove';
import type { MoveFood } from './MoveFood';

/**
 * A food of the outlier's own group in its place, next time (MM-684; the
 * owner, 2026-10-28: "same-group swap only", MM-683). The catalog's
 * nearest better food first (`catalogSwapOf`, held to the group), then the
 * person's own foods at this slot that are of the group (`ownSwapOf` over
 * those alone), then the coach's table of classic swaps for the group
 * (`tableSwapOf`). Never a food on the plate under any spelling (MM-674),
 * nothing snoozed, nothing the safeguards forbid. Undefined when the
 * outlier's group is not known: a food typed by hand or saved gets no swap.
 */
export function sameGroupSwapOf(input: {
  readonly entry: FoodEntry;
  readonly food: MoveFood;
  readonly meal: Meal;
  readonly mealAfter: MealAfter;
  readonly plate: readonly FoodEntry[];
  readonly history: readonly FoodEntry[];
  readonly catalog: TradeCatalog | undefined;
  readonly goal: GoalMode;
  readonly safeguards: InsightSafeguards;
  readonly cautions: ReadonlySet<Caution>;
  readonly snoozed?: ReadonlySet<string> | undefined;
}): Extract<MealMove, { kind: 'swapSameGroup' }> | undefined {
  const limits = swapLimitsOf(input.safeguards, input.cautions, input.goal);
  if (limits === undefined) return undefined;
  const key = foodKeyOf(input.entry);
  const group: FoodGroup | undefined = foodGroupOf(key, [input.entry], input.catalog);
  if (group === undefined) return undefined;
  const barred = (name: string) =>
    input.plate.some((plated) => isSameFoodName(plated.name, name)) || (input.snoozed?.has(name.trim().toLowerCase()) ?? false);
  const adviceFood = adviceFoodOf(input.entry.name, [input.entry]);
  const ofGroup = input.history.filter((e) => foodKeyOf(e) === key || (!barred(e.name) && foodGroupOf(foodKeyOf(e), [e], input.catalog) === group));
  const swapInput: SwapInput = {
    food: { ...adviceFood, carbsG: input.entry.carbsG },
    group,
    meal: input.meal,
    goal: input.goal,
    history: ofGroup.includes(input.entry) ? ofGroup : [...ofGroup, input.entry],
    catalog: input.catalog,
    safeguards: input.safeguards,
    cautions: input.cautions,
  };
  const found = catalogSwapOf(swapInput, limits) ?? ownSwapOf(swapInput, limits) ?? tableSwapOf(swapInput.food, group, limits);
  if (found === undefined || barred(found.name)) return undefined;
  const kcal = found.kcal ?? input.food.kcal;
  const proteinG = found.proteinG ?? input.food.proteinG;
  const replacement: MoveFood = { name: found.name, kcal, proteinG, fatG: found.fatG, source: found.source === 'table' ? 'table' : found.source === 'catalog' ? 'catalog' : 'own' };
  return {
    kind: 'swapSameGroup',
    food: input.food,
    replacement,
    kcalSaved: Math.max(0, input.food.kcal - kcal),
    proteinGainedG: Math.max(0, proteinG - input.food.proteinG),
    mealAfter: mealAfterOf(input.mealAfter.kcal - input.food.kcal + kcal, input.mealAfter.proteinG - input.food.proteinG + proteinG),
  };
}
