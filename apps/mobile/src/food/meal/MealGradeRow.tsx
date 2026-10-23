import type { FoodGradeValue } from '../../domain/food/grade/FoodGradeValue';
import { FoodGrade } from '../FoodGrade';
import '../food.css';

interface MealGradeRowProps {
  grade: FoodGradeValue;
  /** The meal's name, for what is heard with the grade. */
  subject: string;
}

/**
 * A meal's grade on a row of its own (MM-587): the letter right after its
 * label, so it never wraps alone under the totals with nothing saying what
 * it is.
 */
export function MealGradeRow({ grade, subject }: MealGradeRowProps) {
  return (
    <div className="food-meal-grade">
      <span className="food-label">Meal grade</span>
      <FoodGrade grade={grade} subject={subject} scope="meal" />
    </div>
  );
}
