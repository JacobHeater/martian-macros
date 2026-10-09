import 'custom_food_reader.dart';
import 'custom_food_writer.dart';

/// Reads and writes the user's own foods and recipes.
abstract interface class CustomFoodRepository
    implements CustomFoodReader, CustomFoodWriter {}
