import '../food_entry.dart';

/// Reads recently logged foods, for one-tap re-logging.
abstract interface class RecentFoodReader {
  /// The most recently logged distinct foods (by name, ignoring case),
  /// newest first, at most [limit].
  Stream<List<FoodEntry>> watchRecentFoods({int limit = 20});
}
