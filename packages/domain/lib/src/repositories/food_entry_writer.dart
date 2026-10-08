import '../food_entry.dart';

/// Adds and removes logged foods.
abstract interface class FoodEntryWriter {
  /// Saves [entry] and returns its new id. Ids are never reused. The id on
  /// [entry] itself is ignored.
  Future<int> addFood(FoodEntry entry);

  /// Removes the entry with [id]. Does nothing if there is none.
  Future<void> deleteFood(int id);
}
