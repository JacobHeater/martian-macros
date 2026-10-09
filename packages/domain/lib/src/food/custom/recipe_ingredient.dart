import '../portion/nutrition_totals.dart';

/// One line of a recipe: what it is, how much, and the totals for that amount
/// as they were when the recipe was written (MM-45). Totals are stored, not
/// looked up, so a recipe never changes because a food pack did.
final class RecipeIngredient {
  const RecipeIngredient({
    required this.name,
    required this.totals,
    this.grams,
  });

  final String name;

  /// The weight used, when it was entered by weight.
  final double? grams;
  final NutritionTotals totals;
}
