import { energyAgreesWithMacros } from '../../energyAgreesWithMacros';
import { maxKcalPer100g } from '../maxKcalPer100g';
import { maxMealItemGrams } from './maxMealItemGrams';
import type { MealItemDraft } from './MealItemDraft';

/**
 * What is wrong with one food of an analysed meal (MM-586), in words the
 * person and the assistant can both act on; empty when it can be logged.
 * Every number the grade needs is required, and a usual portion (MM-595);
 * none may be negative, the grams must be plausible, and the calories must
 * agree with the macros (MM-53).
 */
export function mealItemProblems(item: MealItemDraft): string[] {
  const problems: string[] = [];
  if (item.name.trim() === '') problems.push('It has no name.');
  // A usual portion, to log it again on its own (MM-595).
  const usual = item.usualPortion;
  if (usual === undefined) problems.push('Missing its usual portion (a reasonable serving of it on its own, and its grams).');
  else if (!(usual.grams > 0) || usual.grams > maxMealItemGrams) {
    problems.push(`A usual portion of ${usual.grams} g is not plausible (more than 0, at most ${maxMealItemGrams.toLocaleString('en-US')}).`);
  }
  const required: readonly [string, number | undefined][] = [
    ['grams', item.grams],
    ['calories', item.kcal],
    ['protein', item.proteinG],
    ['carbohydrate', item.carbsG],
    ['fat', item.fatG],
    ['fiber', item.fiberG],
    ['total sugars', item.micros.of('sugars')],
    ['saturated fat', item.micros.of('saturatedFat')],
    ['sodium', item.micros.of('sodium')],
  ];
  const missing = required.filter(([, value]) => value === undefined || !Number.isFinite(value)).map(([what]) => what);
  if (missing.length > 0) problems.push(`Missing ${missing.join(', ')}.`);
  const negative = required.filter(([, value]) => value !== undefined && value < 0).map(([what]) => what);
  if (negative.length > 0) problems.push(`Below zero: ${negative.join(', ')}.`);
  const { grams, kcal, proteinG, carbsG, fatG, fiberG } = item;
  if (grams !== undefined && (grams <= 0 || grams > maxMealItemGrams)) {
    problems.push(`${grams} g is not a plausible amount of one food (more than 0, at most ${maxMealItemGrams.toLocaleString('en-US')}).`);
  } else if (grams !== undefined && kcal !== undefined && grams > 0 && (kcal / grams) * 100 > maxKcalPer100g) {
    problems.push(`${Math.round(kcal)} kcal in ${grams} g is more than any food holds (at most ${maxKcalPer100g} kcal per 100 g).`);
  }
  if (
    kcal !== undefined &&
    proteinG !== undefined &&
    carbsG !== undefined &&
    fatG !== undefined &&
    [kcal, proteinG, carbsG, fatG].every((value) => value >= 0) &&
    !energyAgreesWithMacros({ kcal, proteinG, carbsG, fatG, fiberG: fiberG ?? 0 })
  ) {
    problems.push(`${Math.round(kcal)} kcal does not agree with the macros (protein and carbohydrate at 4 kcal per gram, fat at 9).`);
  }
  return problems;
}
