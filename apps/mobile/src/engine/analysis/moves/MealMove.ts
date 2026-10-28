import type { Meal } from '../../../domain/Meal';
import type { MealAfter } from './MealAfter';
import type { MoveFood } from './MoveFood';

/**
 * One move the coach may order about a meal (MM-684; the owner's four,
 * 2026-10-28), priced by the engine:
 * - `cutPortion`: the outlier down to one serving or to half, next time;
 * - `addProtein`: a lean protein food added to the meal, next time;
 * - `swapSameGroup`: a food of the outlier's own group in its place, next time;
 * - `nextMeal`: today's order: what is left, what is to go, and the lean
 *   protein food that closes the most of it (`fits` false when the protein
 *   cannot fit inside the calories left, and `food` is then the closest).
 */
export type MealMove =
  | {
      readonly kind: 'cutPortion';
      readonly food: MoveFood;
      /** The share of the food kept: one serving's share, or half. */
      readonly keepShare: number;
      readonly kcalSaved: number;
      readonly proteinLostG: number;
      readonly mealAfter: MealAfter;
    }
  | {
      readonly kind: 'addProtein';
      readonly food: MoveFood;
      readonly added: MoveFood;
      readonly mealAfter: MealAfter;
    }
  | {
      readonly kind: 'swapSameGroup';
      readonly food: MoveFood;
      readonly replacement: MoveFood;
      readonly kcalSaved: number;
      readonly proteinGainedG: number;
      readonly mealAfter: MealAfter;
    }
  | {
      readonly kind: 'nextMeal';
      /** The slot the order is for; undefined after a snack, when it is "your next meal". */
      readonly next: Meal | undefined;
      readonly kcalLeft: number;
      readonly proteinToGoG: number;
      readonly fits: boolean;
      readonly food?: MoveFood | undefined;
    };
