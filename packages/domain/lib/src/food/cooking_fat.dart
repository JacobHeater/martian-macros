import 'portion/nutrition_totals.dart';
import 'portion/portion_unit.dart';

/// How much oil went into cooking a food (MM-152). A teaspoon of oil is about
/// 4.5 g and 40 kcal, a tablespoon about 13.5 g and 120 kcal, all of it fat.
enum CookingFat {
  none(null, 0),
  teaspoon(PortionUnit.teaspoon, 4.5),
  tablespoon(PortionUnit.tablespoon, 13.5);

  const CookingFat(this.unit, this.grams);

  final PortionUnit? unit;
  final double grams;

  /// The oil as its own entry's numbers; null for [none].
  NutritionTotals? get totals => unit == null
      ? null
      : NutritionTotals(
          kcal: grams * 8.84,
          proteinG: 0,
          carbsG: 0,
          fatG: grams,
        );
}
