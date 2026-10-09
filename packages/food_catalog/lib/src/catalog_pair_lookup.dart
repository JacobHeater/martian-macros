import 'catalog_food.dart';

/// Finds the raw or cooked counterpart of a food (MM-151).
abstract interface class CatalogPairLookup {
  /// The food [food] is paired with in its own pack, or null when the source
  /// has only one state of it.
  CatalogFood? pairOf(CatalogFood food);
}
