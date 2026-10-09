import '../portion/nutrition_totals.dart';
import 'meal_kind.dart';
import 'meal_size.dart';

/// The energy of a regular meal: a third of maintenance, rounded to 50 kcal.
double regularMealKcal(double maintenanceKcal) =>
    _roundTo50(maintenanceKcal / 3);

/// The energy of a [size] meal for someone whose maintenance is
/// [maintenanceKcal], rounded to 50 kcal (MM-150).
double mealKcal(MealSize size, double maintenanceKcal) =>
    _roundTo50(maintenanceKcal / 3 * size.multiplier);

/// Totals for a rough estimate of a [size] meal of [kind] (MM-150). Energy is
/// the size's, rounded to 50 kcal; grams follow from the kind's split at 4
/// kcal per gram of protein and carbohydrate and 9 per gram of fat.
NutritionTotals estimateMeal(
  MealSize size,
  MealKind kind, {
  required double maintenanceKcal,
}) {
  final kcal = mealKcal(size, maintenanceKcal);
  return NutritionTotals(
    kcal: kcal,
    proteinG: kcal * kind.protein / 4,
    carbsG: kcal * kind.carbs / 4,
    fatG: kcal * kind.fat / 9,
  );
}

double _roundTo50(double kcal) => (kcal / 50).round() * 50.0;
