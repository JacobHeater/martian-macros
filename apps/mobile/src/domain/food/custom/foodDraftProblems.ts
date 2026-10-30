import { energyAgreesWithMacros } from '../../energyAgreesWithMacros';
import { FoodGroup } from '../FoodGroup';
import { maxKcalPer100g } from '../maxKcalPer100g';
import { maxMealItemGrams } from '../meal/maxMealItemGrams';
import { Micronutrient } from '../micros/Micronutrient';
import type { FoodDraft } from './FoodDraft';

/**
 * What is wrong with one food of an assistant's answer (MM-709), in words
 * the person and the assistant can both act on; empty when it can be
 * saved. Every field of the format is required, 0 counting as given; none
 * may be negative; the serving must weigh something plausible; the
 * calories may not exceed what any food holds, nor a micronutrient its
 * most per 100 g (MM-307); the group must be one of the app's; and the
 * calories must agree with the macros (MM-53).
 */
export function foodDraftProblems(food: FoodDraft): string[] {
  const problems: string[] = [];
  if (food.name.trim() === '') problems.push('It has no name.');
  if (food.servingDescription === undefined) problems.push('Missing what one serving is.');
  if (food.servingGrams === undefined) problems.push('Missing the serving’s grams.');
  else if (!(food.servingGrams > 0) || food.servingGrams > maxMealItemGrams) {
    problems.push(`A serving of ${food.servingGrams} g is not plausible (more than 0, at most ${maxMealItemGrams.toLocaleString('en-US')}).`);
  }
  if (food.group === undefined) problems.push('Missing its food group.');
  else if (FoodGroup.fromName(food.group) === undefined) {
    problems.push(`“${food.group}” is not one of the app’s food groups (${FoodGroup.values.join(', ')}).`);
  }
  const required: readonly [string, number | undefined][] = [
    ['calories', food.kcal],
    ['protein', food.proteinG],
    ['carbohydrate', food.carbsG],
    ['fat', food.fatG],
    ['fiber', food.fiberG],
    ['sugar alcohols', food.sugarAlcoholsG],
    ['alcohol', food.alcoholG],
    ...Micronutrient.values.map((n): [string, number | undefined] => [Micronutrient.label(n).toLowerCase(), food.micros.of(n)]),
  ];
  const missing = required.filter(([, value]) => value === undefined || !Number.isFinite(value)).map(([what]) => what);
  if (missing.length > 0) problems.push(`Missing ${missing.join(', ')} (per 100 g; 0 when it has none).`);
  const negative = required.filter(([, value]) => value !== undefined && value < 0).map(([what]) => what);
  if (negative.length > 0) problems.push(`Below zero: ${negative.join(', ')}.`);
  const tooMuch = Micronutrient.values.filter((n) => {
    const value = food.micros.of(n);
    return value !== undefined && value > Micronutrient.maxPer100g(n);
  });
  if (tooMuch.length > 0) {
    problems.push(
      `More than any food holds per 100 g: ${tooMuch.map((n) => `${Micronutrient.label(n).toLowerCase()} (at most ${Micronutrient.maxPer100g(n).toLocaleString('en-US')} ${Micronutrient.unit(n)})`).join(', ')}.`,
    );
  }
  const { kcal, proteinG, carbsG, fatG, fiberG, alcoholG } = food;
  if (kcal !== undefined && kcal > maxKcalPer100g) {
    problems.push(`${Math.round(kcal)} kcal per 100 g is more than any food holds (at most ${maxKcalPer100g}).`);
  }
  if (
    kcal !== undefined &&
    proteinG !== undefined &&
    carbsG !== undefined &&
    fatG !== undefined &&
    [kcal, proteinG, carbsG, fatG].every((value) => value >= 0) &&
    !energyAgreesWithMacros({ kcal, proteinG, carbsG, fatG, fiberG: fiberG ?? 0, alcoholG: alcoholG ?? 0 })
  ) {
    problems.push(`${Math.round(kcal)} kcal does not agree with the macros (protein and carbohydrate at 4 kcal per gram, fat at 9).`);
  }
  return problems;
}
