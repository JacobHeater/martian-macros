/// The unit an amount is counted in (MM-167). Weight and volume units have
/// exact constants; the hand units are counts of a portion and have none.
enum PortionUnit {
  gram,

  /// Weight ounce (avoirdupois). Never a fluid ounce.
  ounce,

  /// US legal cup.
  cup,
  tablespoon,
  teaspoon,
  milliliter,

  /// US fluid ounce: a volume, so it needs a density to become weight.
  fluidOunce,

  /// A serving as the food's label or source defines it.
  serving,
  palm,
  cuppedHand,
  thumb;

  static const double gramsPerOunce = 28.349523125;
  static const double mlPerCup = 236.588236;
  static const double mlPerTablespoon = 14.78676478125;
  static const double mlPerTeaspoon = 4.92892159375;
  static const double mlPerFluidOunce = 29.5735295625;

  bool get isWeight => this == gram || this == ounce;

  bool get isVolume =>
      this == cup ||
      this == tablespoon ||
      this == teaspoon ||
      this == milliliter ||
      this == fluidOunce;

  /// A count of a hand-sized portion.
  bool get isHand => this == palm || this == cuppedHand || this == thumb;

  /// Grams in one of this unit, or null if it is not a weight.
  double? get grams => switch (this) {
    gram => 1,
    ounce => gramsPerOunce,
    _ => null,
  };

  /// Millilitres in one of this unit, or null if it is not a volume.
  double? get milliliters => switch (this) {
    cup => mlPerCup,
    tablespoon => mlPerTablespoon,
    teaspoon => mlPerTeaspoon,
    milliliter => 1,
    fluidOunce => mlPerFluidOunce,
    _ => null,
  };
}
