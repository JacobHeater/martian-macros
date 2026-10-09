import 'package:mm_domain/mm_domain.dart';

/// How a unit reads next to an amount (MM-167).
extension PortionUnitLabel on PortionUnit {
  /// The unit for an amount of [quantity]: "1 cup", "2 cups".
  String of(double quantity) {
    final one = quantity == 1;
    return switch (this) {
      PortionUnit.gram => 'g',
      PortionUnit.ounce => 'oz',
      PortionUnit.cup => one ? 'cup' : 'cups',
      PortionUnit.tablespoon => 'tbsp',
      PortionUnit.teaspoon => 'tsp',
      PortionUnit.milliliter => 'mL',
      PortionUnit.fluidOunce => 'fl oz',
      PortionUnit.serving => one ? 'serving' : 'servings',
      PortionUnit.palm => one ? 'palm' : 'palms',
      PortionUnit.cuppedHand => one ? 'cupped hand' : 'cupped hands',
      PortionUnit.thumb => one ? 'thumb' : 'thumbs',
    };
  }

  /// The unit on a choice chip, where no amount is attached.
  String get chipLabel => switch (this) {
    PortionUnit.gram => 'Grams',
    PortionUnit.ounce => 'Ounces',
    PortionUnit.cup => 'Cups',
    PortionUnit.tablespoon => 'Tablespoons',
    PortionUnit.teaspoon => 'Teaspoons',
    PortionUnit.milliliter => 'Milliliters',
    PortionUnit.fluidOunce => 'Fluid ounces',
    PortionUnit.serving => 'Servings',
    PortionUnit.palm => 'Palms',
    PortionUnit.cuppedHand => 'Cupped hands',
    PortionUnit.thumb => 'Thumbs',
  };
}
