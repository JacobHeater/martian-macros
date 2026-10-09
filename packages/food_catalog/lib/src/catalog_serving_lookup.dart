import 'catalog_food.dart';
import 'catalog_serving.dart';

/// Lists the portions a food comes in.
abstract interface class CatalogServingLookup {
  List<CatalogServing> servingsOf(CatalogFood food);
}
