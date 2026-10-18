import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import { roundHalfAwayFromZero } from '../lang/roundHalfAwayFromZero';
import { FoodGradeRule } from './FoodGradeRule';
import { gradeLetterOf } from './gradeLetterOf';

/**
 * A meal's or a day's grade (MM-370, MM-382): the calorie-weighted mean of
 * its graded entries' scores, rounded half up (−2.5 is −2, the panel's
 * ME-9), turned back into a letter. It names nothing as not counted and
 * states no vitamins and minerals: those are each food's own.
 * A question mark when graded entries carry less than
 * `FoodGradeRule.rollupCoverage` of the calories, saying what share could
 * be graded; an entry that can't be graded counts as not covered.
 */
export function gradeOfMeal(entries: readonly { kcal: number; grade: FoodGradeValue }[], what: 'meal' | 'day'): FoodGradeValue | undefined {
  const total = entries.reduce((sum, e) => sum + e.kcal, 0);
  if (entries.length === 0 || total <= 0) return undefined;
  const graded = entries.filter((e) => e.grade.kind === 'graded');
  const covered = graded.reduce((sum, e) => sum + e.kcal, 0);
  if (covered < total * FoodGradeRule.rollupCoverage) {
    const share = roundHalfAwayFromZero((covered / total) * 100) + 0;
    return {
      kind: 'ungradable',
      reason:
        share === 0
          ? `None of this ${what}’s calories come from foods that can be graded.`
          : `Only ${share}% of this ${what}’s calories come from foods that can be graded, so it has no grade.`,
    };
  }
  const mean = graded.reduce((sum, e) => sum + e.kcal * (e.grade.kind === 'graded' ? e.grade.score : 0), 0) / covered;
  const score = Math.floor(mean + 0.5) + 0;
  return { kind: 'graded', letter: gradeLetterOf(score), score, notCounted: [], statedMicronutrients: 0 };
}
