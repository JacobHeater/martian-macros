import '../portion/nutrition_totals.dart';
import 'custom_food_kind.dart';
import 'recipe_ingredient.dart';

/// A food or recipe the user defined once to log in any amount (MM-45).
///
/// Numbers are per serving. A recipe's per-serving numbers are calculated from
/// its [ingredients] and [servings], and its serving weighs
/// [cookedWeightGrams] divided by [servings] when the cooked weight is known.
/// Editing one never changes entries already logged from it.
final class CustomFood {
  const CustomFood({
    required this.id,
    required this.name,
    required this.kind,
    required this.servingDescription,
    required this.perServing,
    this.servingGrams,
    this.barcode,
    this.servings,
    this.cookedWeightGrams,
    this.ingredients = const [],
  });

  /// Database id; 0 for one not yet saved.
  final int id;
  final String name;
  final CustomFoodKind kind;

  /// "1 bar", "1 serving".
  final String servingDescription;

  /// What one serving weighs; null when it is not known (a recipe without a
  /// cooked weight), in which case it is logged by servings only.
  final double? servingGrams;
  final NutritionTotals perServing;

  /// GTIN-14, so scanning the product finds it (MM-43).
  final String? barcode;

  /// How many servings a recipe makes.
  final double? servings;
  final double? cookedWeightGrams;
  final List<RecipeIngredient> ingredients;
}
