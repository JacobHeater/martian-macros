import '../food/custom/custom_food.dart';

/// Reads the foods and recipes the user saved.
abstract interface class CustomFoodReader {
  /// Every saved food, by name, then the full list after each change.
  Stream<List<CustomFood>> watchCustomFoods();
}
