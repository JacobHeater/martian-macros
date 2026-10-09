import 'package:mm_food_catalog/mm_food_catalog.dart';

const _stateWords = {'raw', 'dry', 'cooked'};

/// Cooking words that vary between the cooked entries of one food.
const _methodWords = {
  'boiled',
  'roasted',
  'baked',
  'fried',
  'pan-fried',
  'grilled',
  'broiled',
  'steamed',
  'simmered',
  'stewed',
  'microwaved',
  'drained',
  'with salt',
  'without salt',
  'with added salt',
  'without added salt',
};

/// A USDA-style food name split into its preparation state, the cooking
/// words that vary between entries, and the rest that identifies the food.
final class ParsedFoodName {
  const ParsedFoodName(this.state, this.base, this.methods);

  final PreparationState? state;
  final String base;
  final Set<String> methods;

  factory ParsedFoodName.of(String name) {
    final tokens = [
      for (final t in name.toLowerCase().split(','))
        if (t.trim().isNotEmpty) t.trim(),
    ];
    PreparationState? state;
    final methods = <String>{};
    final rest = <String>[];
    for (final t in tokens) {
      if (_stateWords.contains(t)) {
        state = t == 'cooked' ? PreparationState.cooked : PreparationState.raw;
      } else if (_methodWords.contains(t)) {
        methods.add(t);
      } else {
        rest.add(t);
      }
    }
    rest.sort();
    return ParsedFoodName(state, rest.join('|'), methods);
  }
}
