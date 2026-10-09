import 'package:mm_food_catalog/mm_food_catalog.dart';

/// Labels may declare under 5 kcal as zero, which adds up for foods eaten in
/// many small servings (MM-153). Returns the note for [food] eaten as
/// [serving], or null when it does not apply.
String? roundedToZeroNote(CatalogFood food, CatalogServing serving) {
  final perServing = food.kcal * serving.grams / 100;
  if (serving.grams >= 5 || perServing >= 0.5) return null;
  return 'Labels may round small servings to zero. Many servings add up.';
}
