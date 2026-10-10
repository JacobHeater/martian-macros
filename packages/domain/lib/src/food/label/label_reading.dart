/// What was read from a Nutrition Facts panel (MM-44). Every field is null
/// when the reader did not find it, so the form can ask rather than guess.
/// Numbers are per serving, as the US label states them.
final class LabelReading {
  const LabelReading({
    this.servingText,
    this.servingGrams,
    this.kcal,
    this.proteinG,
    this.carbsG,
    this.fatG,
    this.fiberG,
    this.sodiumMg,
  });

  /// "2/3 cup (55g)", as printed.
  final String? servingText;
  final double? servingGrams;
  final double? kcal;
  final double? proteinG;
  final double? carbsG;
  final double? fatG;
  final double? fiberG;
  final double? sodiumMg;

  /// Whether anything usable was found.
  bool get isEmpty =>
      kcal == null && proteinG == null && carbsG == null && fatG == null;
}
