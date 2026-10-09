import 'catalog_food.dart';
import 'catalog_serving.dart';

/// A food with its servings and barcodes, as written into a pack.
final class PackEntry {
  const PackEntry({
    required this.food,
    this.servings = const [],
    this.barcodes = const [],
  });

  final CatalogFood food;
  final List<CatalogServing> servings;

  /// GTIN-14 only (see `normalizeBarcode`).
  final List<String> barcodes;
}
