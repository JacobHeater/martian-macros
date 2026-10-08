import '../calendar_date.dart';
import '../food_entry.dart';

/// Reads the food logged on one day.
abstract interface class FoodDayReader {
  /// The entries for [date] in the order they were added, then the full
  /// list after each change.
  Stream<List<FoodEntry>> watchFood(CalendarDate date);
}
