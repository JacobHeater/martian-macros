import type { FoodGradeValue } from '../domain/food/grade/FoodGradeValue';
import type { CatalogFood } from '../foodCatalog/CatalogFood';
import { gradeMicrosFrom } from '../engine/gradeMicrosFrom';
import { gradeOfNutrition } from '../engine/gradeOfNutrition';

/** A pack food's grade (MM-382): its values are per 100 g already. */
export function gradeOfCatalogFood(food: CatalogFood): FoodGradeValue {
  return gradeOfNutrition(
    {
    kcal: food.kcal,
    proteinG: food.proteinG,
    fatG: food.fatG,
    carbsG: food.carbsG,
    fiberG: food.fiberG,
    sodiumMg: food.sodiumMg,
    sugarsG: food.micros.sugars,
    saturatedFatG: food.micros.saturatedFat,
    alcoholG: food.alcoholG,
    micros: gradeMicrosFrom((n) => food.micros[n]),
    },
    { name: food.name },
  );
}
