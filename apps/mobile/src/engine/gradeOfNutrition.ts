import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import { FoodGradeRule } from './FoodGradeRule';
import { gradeLetterOf } from './gradeLetterOf';
import type { GradeNutrition } from './GradeNutrition';
import { nutrientProfileScore } from './nutrientProfileScore';

/** What the method needs that a food may not state, in the order a reason names them. */
const required = [
  ['sugarsG', 'sugars'],
  ['saturatedFatG', 'saturated fat'],
  ['sodiumMg', 'sodium'],
  ['fiberG', 'fiber'],
] as const;

/** "sugars, saturated fat and fiber" */
function list(names: readonly string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * A food's grade from what it states per 100 g (MM-369, MM-370), or why
 * there can't be one: an alcoholic drink is outside the method's scope, and
 * a missing value is never counted as zero (MM-310), so a food without what
 * the method needs is not guessed. The score comes with the grade so meals
 * and days can be averaged by it.
 */
export function gradeOfNutrition(per100g: GradeNutrition): FoodGradeValue {
  if (per100g.alcoholG !== undefined && per100g.alcoholG > FoodGradeRule.alcoholLimitG) {
    return { kind: 'ungradable', reason: 'Alcoholic drinks aren’t graded.' };
  }
  const missing = required.filter(([key]) => per100g[key] === undefined).map(([, name]) => name);
  if (missing.length > 0) {
    const verb = missing.length === 1 ? 'isn’t' : 'aren’t';
    return { kind: 'ungradable', reason: `Can’t be graded: ${list(missing)} ${verb} stated for this food.` };
  }
  const { score } = nutrientProfileScore({
    kcal: per100g.kcal,
    proteinG: per100g.proteinG,
    sugarsG: per100g.sugarsG as number,
    saturatedFatG: per100g.saturatedFatG as number,
    sodiumMg: per100g.sodiumMg as number,
    fiberG: per100g.fiberG as number,
  });
  return { kind: 'graded', letter: gradeLetterOf(score), score };
}
