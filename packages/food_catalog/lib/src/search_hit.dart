import 'catalog_food.dart';

/// A search result and how well it matched (lower is better).
final class SearchHit {
  const SearchHit(this.food, this.score);

  final CatalogFood food;
  final double score;
}
