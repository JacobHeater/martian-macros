import 'food_item.dart';
import 'outcome.dart';

/// Finds a packaged food by barcode.
abstract interface class FoodBarcodeLookup {
  /// The item with this GTIN-14, or [NotFound].
  Future<Outcome<FoodItem>> lookup(String gtin14);
}
