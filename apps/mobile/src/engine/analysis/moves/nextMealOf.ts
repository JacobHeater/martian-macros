import type { FoodEntry } from '../../../domain/FoodEntry';
import type { Meal } from '../../../domain/Meal';
import type { TradeCatalog } from '../TradeCatalog';
import { leanProteinOf } from './leanProteinOf';
import type { MealMove } from './MealMove';
import { nextMealSlot } from './nextMealSlot';

/**
 * Today's order (MM-684): the calories left, the protein to go, and the
 * lean protein food that closes the most of it inside the calories left,
 * looked for at the next slot (the catalog first, then the person's foods
 * there). `fits` is false when `proteinToGoG * 4 > kcalLeft`: the food is
 * then the closest the person gets. No food when no calories are left.
 */
export function nextMealOf(input: {
  readonly meal: Meal;
  readonly kcalLeft: number;
  readonly proteinToGoG: number;
  readonly plate: readonly FoodEntry[];
  readonly history: readonly FoodEntry[];
  readonly catalog: TradeCatalog | undefined;
  readonly snoozed?: ReadonlySet<string> | undefined;
}): Extract<MealMove, { kind: 'nextMeal' }> {
  const next = nextMealSlot(input.meal);
  const food =
    input.kcalLeft > 0
      ? leanProteinOf({
          catalog: input.catalog,
          history: input.history,
          meal: next ?? input.meal,
          plate: input.plate,
          maxKcal: input.kcalLeft,
          snoozed: input.snoozed,
        })
      : undefined;
  return {
    kind: 'nextMeal',
    next,
    kcalLeft: input.kcalLeft,
    proteinToGoG: input.proteinToGoG,
    fits: input.proteinToGoG * 4 <= input.kcalLeft,
    ...(food === undefined ? {} : { food }),
  };
}
