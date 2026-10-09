import '../food/custom/custom_food.dart';

/// Saves and deletes the user's own foods and recipes.
abstract interface class CustomFoodWriter {
  /// Saves [food]: a new one when its id is 0, otherwise a replacement of the
  /// one with that id. Returns its id. Entries already logged from it are not
  /// touched.
  Future<int> saveCustomFood(CustomFood food);

  /// Removes the food with [id]. Does nothing if there is none.
  Future<void> deleteCustomFood(int id);
}
