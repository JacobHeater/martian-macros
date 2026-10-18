import { FoodGradeLetter } from '../domain/food/grade/FoodGradeLetter';
import { FoodGradeRule } from './FoodGradeRule';

/** The twelve-step letter for a nutrient-density score (MM-380): the first step whose floor the score reaches. */
export function gradeLetterOf(score: number): FoodGradeLetter {
  const index = FoodGradeRule.letterSteps.findIndex((floor) => score >= floor);
  return FoodGradeLetter.values[index < 0 ? FoodGradeLetter.values.length - 1 : index] ?? 'D-';
}
