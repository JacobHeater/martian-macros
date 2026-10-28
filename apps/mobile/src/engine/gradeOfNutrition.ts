import { friedByName } from '../domain/food/grade/friedByName';
import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import type { GradeCap } from '../domain/food/grade/GradeCap';
import { FoodGradeRule } from './FoodGradeRule';
import { gradeLetterOf } from './gradeLetterOf';
import type { GradeNutrition } from './GradeNutrition';
import { nutrientDensityScore } from './nutrientDensityScore';

/**
 * A food's grade from what it states per 100 g (MM-380, MM-382), or why
 * there can't be one: an alcoholic drink is not graded; a food with almost
 * no calories has nothing to grade per calorie; and a missing value is
 * never counted as zero (MM-310), so a food without sodium stated is not
 * guessed. Fiber counts only for a food, so a fiber that is not stated is
 * counted as none and the grade says so (MM-656, the owner: a soda with no
 * fiber stated had no grade): the letter can then only be a step too low,
 * never too high. Sugars, saturated fat and the vitamins and minerals are
 * counted when stated, and the grade says when they were not. The score
 * comes with the grade so meals and days can be averaged by it. A fried
 * food, by the words of `name`, or a sweet and fatty one, by its numbers,
 * is held to C- (MM-660, the owner, `FoodGradeRule.cap`): a nutrient table
 * cannot see a fryer, and per calorie a battered, sauced dish can look like
 * a grilled one.
 */
export function gradeOfNutrition(per100g: GradeNutrition, { name }: { name?: string | undefined } = {}): FoodGradeValue {
  if (per100g.alcoholG !== undefined && per100g.alcoholG > FoodGradeRule.alcoholLimitG) {
    return { kind: 'ungradable', reason: 'Alcoholic drinks aren’t graded.' };
  }
  if (!(per100g.kcal >= FoodGradeRule.minKcalPer100g)) {
    return { kind: 'ungradable', reason: 'Almost no calories, so there’s nothing to grade per calorie.' };
  }
  if (per100g.sodiumMg === undefined) {
    return { kind: 'ungradable', reason: 'Sodium isn’t stated for this food, so it can’t be graded.' };
  }
  const { score, points, notCounted, statedMicronutrients } = nutrientDensityScore({
    kcal: per100g.kcal,
    proteinG: per100g.proteinG,
    fiberG: per100g.fiberG ?? 0,
    sodiumMg: per100g.sodiumMg,
    sugarsG: per100g.sugarsG,
    saturatedFatG: per100g.saturatedFatG,
    micros: per100g.micros,
  });
  const cap = capOf(per100g, name, points.protein + points.fiber + points.micronutrients);
  const held = cap === undefined ? score : Math.min(score, FoodGradeRule.cap.score);
  return {
    kind: 'graded',
    letter: gradeLetterOf(held),
    score: held,
    notCounted: per100g.fiberG === undefined ? ['fiber', ...notCounted] : notCounted,
    statedMicronutrients,
    ...(cap === undefined ? {} : { cap }),
  };
}

/** The cap that holds the food, if one does: its name's words first, then its numbers (MM-660). */
function capOf(per100g: GradeNutrition, name: string | undefined, pointsFor: number): GradeCap | undefined {
  if (name !== undefined && friedByName(name)) return 'fried';
  const rule = FoodGradeRule.cap.sweetAndFatty;
  if (per100g.fatG === undefined || per100g.sugarsG === undefined) return undefined;
  const sweetAndFatty =
    per100g.kcal >= rule.minKcalPer100 &&
    (per100g.fatG * 9) / per100g.kcal >= rule.fatShare &&
    per100g.sugarsG >= rule.sugarsGPer100 &&
    pointsFor < rule.maxPointsFor;
  return sweetAndFatty ? 'sweetAndFatty' : undefined;
}
