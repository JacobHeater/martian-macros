import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import type { CatalogFood } from '../foodCatalog/CatalogFood';
import { gradeOfNutrition } from '../engine/gradeOfNutrition';

/** A pack food's grade (MM-370): its values are per 100 g already. */
export function gradeOfCatalogFood(food: CatalogFood): FoodGradeValue {
  return gradeOfNutrition({
    kcal: food.kcal,
    proteinG: food.proteinG,
    sugarsG: food.micros.sugars,
    saturatedFatG: food.micros.saturatedFat,
    sodiumMg: food.sodiumMg,
    fiberG: food.fiberG,
    alcoholG: food.alcoholG,
  });
}
