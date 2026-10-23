import type { FoodGradeValue } from '../../domain/food/grade/FoodGradeValue';
import type { HandSize } from '../../domain/food/hand/HandSize';
import type { LoggedMeal } from '../../domain/food/meal/LoggedMeal';
import { gradeOfFoodEntry } from '../../engine/gradeOfFoodEntry';
import { gradeOfMeal } from '../../engine/gradeOfMeal';

/** A logged meal's grade (MM-587): its foods' grades counted by their calories, as a slot's are (MM-370). */
export function gradeOfLoggedMeal(meal: LoggedMeal, { hand }: { hand?: HandSize | undefined } = {}): FoodGradeValue | undefined {
  return gradeOfMeal(
    meal.items.map((item) => ({ kcal: item.kcal, grade: gradeOfFoodEntry(item, { hand }) })),
    'meal',
  );
}
