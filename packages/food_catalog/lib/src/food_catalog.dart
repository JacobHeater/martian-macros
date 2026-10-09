import 'catalog_barcode_lookup.dart';
import 'catalog_food.dart';
import 'catalog_search.dart';
import 'catalog_serving.dart';
import 'catalog_serving_lookup.dart';
import 'food_pack.dart';
import 'search_hit.dart';

/// Several installed packs presented as one: search returns one ranked list,
/// and a barcode is looked up in each pack in turn.
final class FoodCatalog
    implements CatalogSearch, CatalogBarcodeLookup, CatalogServingLookup {
  const FoodCatalog(this.packs);

  final List<FoodPack> packs;

  @override
  List<SearchHit> search(String query, {int limit = 25, int offset = 0}) {
    final hits = [
      for (final pack in packs) ...pack.search(query, limit: limit + offset),
    ]..sort((a, b) => a.score.compareTo(b.score));
    return hits.skip(offset).take(limit).toList();
  }

  @override
  CatalogFood? byBarcode(String gtin14) {
    for (final pack in packs) {
      final food = pack.byBarcode(gtin14);
      if (food != null) return food;
    }
    return null;
  }

  @override
  List<CatalogServing> servingsOf(CatalogFood food) {
    for (final pack in packs) {
      if (pack.packId == food.packId) return pack.servingsOf(food);
    }
    return const [];
  }
}
