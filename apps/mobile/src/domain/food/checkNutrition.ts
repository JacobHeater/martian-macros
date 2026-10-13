import { energyAgreesWithMacros } from '../energyAgreesWithMacros';
import type { NutritionPer100g } from './NutritionPer100g';
import { maxKcalPer100g } from './maxKcalPer100g';
import type { NutritionProblem } from './NutritionProblem';

/**
 * The first reason `food` must not be used, or undefined when it is sound
 * (MM-53).
 *
 * The one rule behind the food pipeline, typed entries, label reading and
 * custom foods, so they cannot drift apart.
 */
export function checkNutrition(food: NutritionPer100g): NutritionProblem | undefined {
  if (food.name.trim().length === 0) return 'missingName';
  const kcal = food.kcal;
  const protein = food.proteinG;
  const carbs = food.carbsG;
  const fat = food.fatG;
  if (kcal === undefined || protein === undefined || carbs === undefined || fat === undefined) {
    return 'missingValue';
  }
  const all = [kcal, protein, carbs, fat];
  if (food.fiberG !== undefined) all.push(food.fiberG);
  if (food.alcoholG !== undefined) all.push(food.alcoholG);
  if (all.some((v) => v < 0)) return 'negativeValue';
  if (protein + carbs + fat > 100) return 'macrosExceed100g';
  if (kcal > maxKcalPer100g) return 'energyTooHigh';
  const agrees = energyAgreesWithMacros({
    kcal,
    proteinG: protein,
    carbsG: carbs,
    fatG: fat,
    fiberG: food.fiberG ?? 0,
    alcoholG: food.alcoholG ?? 0,
  });
  return agrees ? undefined : 'energyDisagreesWithMacros';
}
