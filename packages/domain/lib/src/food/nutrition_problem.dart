/// Why a food's nutrition values are rejected (MM-53), checked in this order.
enum NutritionProblem {
  missingName,
  missingValue,
  negativeValue,
  macrosExceed100g,
  energyTooHigh,
  energyDisagreesWithMacros,
}
