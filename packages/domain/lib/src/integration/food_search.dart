import 'food_item.dart';
import 'outcome.dart';

/// Finds foods by name. Implemented by the local pack, a live service, or a
/// fixture.
abstract interface class FoodSearch {
  /// Items whose name or brand contains [query] (ignoring case), best first,
  /// at most [limit]. No match is `Succeeded([])`, not [NotFound].
  Future<Outcome<List<FoodItem>>> search(String query, {int limit = 25});
}
