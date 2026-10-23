import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import { FoodGradeRule } from './FoodGradeRule';
import { gradeLetterOf } from './gradeLetterOf';
import type { GradeNutrition } from './GradeNutrition';
import { nutrientDensityScore } from './nutrientDensityScore';

/**
 * A food's grade from what it states per 100 g (MM-380, MM-382), or why
 * there can't be one: an alcoholic drink is not graded; a food with almost
 * no calories has nothing to grade per calorie; and a missing value is
 * never counted as zero (MM-310), so a food without sodium stated is not
 * guessed. Fiber is part of the carbohydrate, so a fiber that is not
 * stated lies between none and the carbs that are not sugars: when the
 * letter is the same at both ends (cheese, meat, eggs, oils), the food is
 * graded as having none and the grade says fiber was not stated (MM-567).
 * Sugars, saturated fat and the vitamins and minerals are counted when
 * stated, and the grade says when they were not. The score comes with the
 * grade so meals and days can be averaged by it.
 */
export function gradeOfNutrition(per100g: GradeNutrition): FoodGradeValue {
  if (per100g.alcoholG !== undefined && per100g.alcoholG > FoodGradeRule.alcoholLimitG) {
    return { kind: 'ungradable', reason: 'Alcoholic drinks aren’t graded.' };
  }
  if (!(per100g.kcal >= FoodGradeRule.minKcalPer100g)) {
    return { kind: 'ungradable', reason: 'Almost no calories, so there’s nothing to grade per calorie.' };
  }
  const fiberMost = fiberAtMost(per100g);
  const missing = [
    ...(fiberMost === undefined ? ['fiber'] : []),
    ...(per100g.sodiumMg === undefined ? ['sodium'] : []),
  ];
  if (missing.length > 0) {
    const verb = missing.length === 1 ? 'isn’t' : 'aren’t';
    const list = missing.join(' and ');
    return { kind: 'ungradable', reason: `${list.charAt(0).toUpperCase()}${list.slice(1)} ${verb} stated for this food, so it can’t be graded.` };
  }
  const scoreWith = (fiberG: number) =>
    nutrientDensityScore({
      kcal: per100g.kcal,
      proteinG: per100g.proteinG,
      fiberG,
      sodiumMg: per100g.sodiumMg as number,
      sugarsG: per100g.sugarsG,
      saturatedFatG: per100g.saturatedFatG,
      micros: per100g.micros,
    });
  if (per100g.fiberG !== undefined) {
    const { score, notCounted, statedMicronutrients } = scoreWith(per100g.fiberG);
    return { kind: 'graded', letter: gradeLetterOf(score), score, notCounted, statedMicronutrients };
  }
  const least = scoreWith(0);
  if (gradeLetterOf(least.score) !== gradeLetterOf(scoreWith(fiberMost as number).score)) {
    return { kind: 'ungradable', reason: 'Fiber isn’t stated for this food, and with its carbs it could change the grade.' };
  }
  return {
    kind: 'graded',
    letter: gradeLetterOf(least.score),
    score: least.score,
    notCounted: ['fiber', ...least.notCounted],
    statedMicronutrients: least.statedMicronutrients,
  };
}

/**
 * The most fiber the food can hold per 100 g: what it states, or else its
 * carbs less its sugars, which are not fiber; undefined when neither is known.
 */
function fiberAtMost(per100g: GradeNutrition): number | undefined {
  if (per100g.fiberG !== undefined) return per100g.fiberG;
  if (per100g.carbsG === undefined) return undefined;
  return Math.max(0, per100g.carbsG - (per100g.sugarsG ?? 0));
}
