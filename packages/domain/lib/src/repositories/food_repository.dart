import 'food_day_reader.dart';
import 'food_entry_writer.dart';
import 'recent_food_reader.dart';

/// Reads and writes the food log.
abstract interface class FoodRepository
    implements FoodDayReader, RecentFoodReader, FoodEntryWriter {}
