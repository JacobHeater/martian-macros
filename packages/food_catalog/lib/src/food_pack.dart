import 'catalog_barcode_lookup.dart';
import 'catalog_pair_lookup.dart';
import 'catalog_search.dart';
import 'catalog_serving_lookup.dart';

/// One installed pack: everything the app asks of it, nothing about how it is
/// stored. Callers that need less depend on the narrower interfaces.
abstract interface class FoodPack
    implements
        CatalogSearch,
        CatalogBarcodeLookup,
        CatalogServingLookup,
        CatalogPairLookup {
  String get packId;
}
