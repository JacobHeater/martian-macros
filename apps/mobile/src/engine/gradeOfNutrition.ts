import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import { FoodGradeRule } from './FoodGradeRule';
import { gradeLetterOf } from './gradeLetterOf';
import type { GradeNutrition } from './GradeNutrition';
import { nutrientDensityScore } from './nutrientDensityScore';

/** What the method requires that a food may not state, in the order a reason names them. */
const required = [
  ['fiberG', 'fiber'],
  ['sodiumMg', 'sodium'],
] as const;

/**
 * A food's grade from what it states per 100 g (MM-380, MM-382), or why
 * there can't be one: an alcoholic drink is not graded; a food with almost
 * no calories has nothing to grade per calorie; and a missing value is
 * never counted as zero (MM-310), so a food without fiber or sodium stated
 * is not guessed. Sugars, saturated fat and the vitamins and minerals are
 * counted when stated, and the grade says when they were not. The score
 * comes with the grade so meals and days can be averaged by it.
 */
export function gradeOfNutrition(per100g: GradeNutrition): FoodGradeValue {
  if (per100g.alcoholG !== undefined && per100g.alcoholG > FoodGradeRule.alcoholLimitG) {
    return { kind: 'ungradable', reason: 'Alcoholic drinks aren’t graded.' };
  }
  if (!(per100g.kcal >= FoodGradeRule.minKcalPer100g)) {
    return { kind: 'ungradable', reason: 'Almost no calories, so there’s nothing to grade per calorie.' };
  }
  const missing = required.filter(([key]) => per100g[key] === undefined).map(([, name]) => name);
  if (missing.length > 0) {
    const verb = missing.length === 1 ? 'isn’t' : 'aren’t';
    return { kind: 'ungradable', reason: `Can’t be graded: ${missing.join(' and ')} ${verb} stated for this food.` };
  }
  const { score, notCounted, statedMicronutrients } = nutrientDensityScore({
    kcal: per100g.kcal,
    proteinG: per100g.proteinG,
    fiberG: per100g.fiberG as number,
    sodiumMg: per100g.sodiumMg as number,
    sugarsG: per100g.sugarsG,
    saturatedFatG: per100g.saturatedFatG,
    micros: per100g.micros,
  });
  return { kind: 'graded', letter: gradeLetterOf(score), score, notCounted, statedMicronutrients };
}
