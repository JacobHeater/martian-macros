/// A food from a catalog, with its nutrition for one serving.
final class FoodItem {
  const FoodItem({
    required this.id,
    required this.name,
    required this.servingLabel,
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    this.brand,
    this.barcode,
  });

  /// Stable within its catalog.
  final String id;
  final String name;
  final String? brand;

  /// GTIN-14, if the item is a packaged product.
  final String? barcode;

  /// For example "1 cup (240 g)".
  final String servingLabel;
  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
}
