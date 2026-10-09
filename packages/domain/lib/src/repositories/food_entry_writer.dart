import '../food_entry.dart';

/// Adds, changes and removes logged foods.
abstract interface class FoodEntryWriter {
  /// Saves [entry] and returns its new id. Ids are never reused. The id on
  /// [entry] itself is ignored.
  Future<int> addFood(FoodEntry entry);

  /// Replaces everything about the entry with [entry]'s id: its day, meal,
  /// name, macros and how it was measured. Does nothing if there is none.
  Future<void> updateFood(FoodEntry entry);

  /// Removes the entry with [id]. Does nothing if there is none.
  Future<void> deleteFood(int id);
}
