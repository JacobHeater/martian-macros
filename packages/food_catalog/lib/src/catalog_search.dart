import 'search_hit.dart';

/// Finds foods by name as the user types.
abstract interface class CatalogSearch {
  /// Foods whose name or brand starts with each word of [query], best first.
  List<SearchHit> search(String query, {int limit = 25, int offset = 0});
}
