import '../food_energy.dart';
import 'nutrition_per100g.dart';
import 'nutrition_problem.dart';

/// Per 100 g, energy above this is not a food (pure fat is about 900).
const maxKcalPer100g = 900.0;

/// The first reason [food] must not be used, or null when it is sound (MM-53).
///
/// The one rule behind the food pipeline, typed entries, label reading and
/// custom foods, so they cannot drift apart.
NutritionProblem? checkNutrition(NutritionPer100g food) {
  if (food.name.trim().isEmpty) return NutritionProblem.missingName;
  final kcal = food.kcal;
  final protein = food.proteinG;
  final carbs = food.carbsG;
  final fat = food.fatG;
  if (kcal == null || protein == null || carbs == null || fat == null) {
    return NutritionProblem.missingValue;
  }
  final all = [kcal, protein, carbs, fat, ?food.fiberG, ?food.alcoholG];
  if (all.any((v) => v < 0)) return NutritionProblem.negativeValue;
  if (protein + carbs + fat > 100) return NutritionProblem.macrosExceed100g;
  if (kcal > maxKcalPer100g) return NutritionProblem.energyTooHigh;
  final agrees = energyAgreesWithMacros(
    kcal: kcal,
    proteinG: protein,
    carbsG: carbs,
    fatG: fat,
    fiberG: food.fiberG ?? 0,
    alcoholG: food.alcoholG ?? 0,
  );
  return agrees ? null : NutritionProblem.energyDisagreesWithMacros;
}
