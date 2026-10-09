import 'catalog_barcode_lookup.dart';
import 'catalog_food.dart';
import 'catalog_pair_lookup.dart';
import 'catalog_search.dart';
import 'catalog_serving.dart';
import 'catalog_serving_lookup.dart';
import 'food_pack.dart';
import 'search_hit.dart';

/// Several installed packs presented as one: search returns one ranked list,
/// and a barcode is looked up in each pack in turn.
final class FoodCatalog
    implements
        CatalogSearch,
        CatalogBarcodeLookup,
        CatalogServingLookup,
        CatalogPairLookup {
  const FoodCatalog(this.packs);

  final List<FoodPack> packs;

  @override
  List<SearchHit> search(String query, {int limit = 25, int offset = 0}) {
    final hits = [
      for (final pack in packs) ...pack.search(query, limit: limit + offset),
    ]..sort(_byTrustThenMatch);
    return hits.skip(offset).take(limit).toList();
  }

  /// Reference foods before label foods before "check this" ones, then the
  /// better text match (MM-42, MM-153). So a generic "Oats" lists above a
  /// branded product that merely matches the word more tightly.
  static int _byTrustThenMatch(SearchHit a, SearchHit b) {
    final byTier = a.food.tier.code.compareTo(b.food.tier.code);
    return byTier != 0 ? byTier : a.score.compareTo(b.score);
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
  CatalogFood? pairOf(CatalogFood food) {
    for (final pack in packs) {
      if (pack.packId == food.packId) return pack.pairOf(food);
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
