import { FoodGradeLetter } from '../domain/food/grade/FoodGradeLetter';
import { FoodGradeRule } from './FoodGradeRule';

/** The twelve-step letter for a nutrient-profile score (MM-369): the first step whose top the score does not pass. */
export function gradeLetterOf(score: number): FoodGradeLetter {
  const index = FoodGradeRule.letterSteps.findIndex((top) => score <= top);
  return FoodGradeLetter.values[index < 0 ? FoodGradeLetter.values.length - 1 : index] ?? 'D-';
}
