import 'catalog_food.dart';

/// Finds a food by its barcode.
abstract interface class CatalogBarcodeLookup {
  /// The food for a GTIN-14 (see `normalizeBarcode`), or null.
  CatalogFood? byBarcode(String gtin14);
}
