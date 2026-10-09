/// A food's values per 100 g, as a source states them. Anything a source left
/// out is null.
final class NutritionPer100g {
  const NutritionPer100g({
    required this.name,
    this.kcal,
    this.proteinG,
    this.carbsG,
    this.fatG,
    this.fiberG,
    this.alcoholG,
  });

  final String name;
  final double? kcal;
  final double? proteinG;
  final double? carbsG;
  final double? fatG;
  final double? fiberG;
  final double? alcoholG;
}
