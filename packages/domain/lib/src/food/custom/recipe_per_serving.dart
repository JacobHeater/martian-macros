import '../portion/nutrition_totals.dart';
import 'recipe_ingredient.dart';

/// One serving of a recipe: the summed ingredients divided by [servings]
/// (MM-45). Null when [servings] is not above zero.
NutritionTotals? recipePerServing(
  List<RecipeIngredient> ingredients,
  double servings,
) {
  if (!(servings > 0) || !servings.isFinite) return null;
  var kcal = 0.0;
  var protein = 0.0;
  var carbs = 0.0;
  var fat = 0.0;
  for (final i in ingredients) {
    kcal += i.totals.kcal;
    protein += i.totals.proteinG;
    carbs += i.totals.carbsG;
    fat += i.totals.fatG;
  }
  return NutritionTotals(
    kcal: kcal / servings,
    proteinG: protein / servings,
    carbsG: carbs / servings,
    fatG: fat / servings,
  );
}

/// What one serving weighs: the cooked weight of the whole recipe divided by
/// its servings, or null when the cooked weight is not known. Raw ingredient
/// weights are never used: cooking changes weight, not energy.
double? recipeServingGrams(double? cookedWeightGrams, double servings) {
  if (cookedWeightGrams == null ||
      !(cookedWeightGrams > 0) ||
      !(servings > 0)) {
    return null;
  }
  return cookedWeightGrams / servings;
}
