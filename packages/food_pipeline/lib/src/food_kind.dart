/// Which pack a candidate belongs to.
enum FoodKind {
  /// Foods without a barcode that every user can search (USDA Foundation and
  /// SR Legacy). The pack that can ship in the app.
  generic,

  /// Products with a barcode (USDA Branded and Open Food Facts). The pack that
  /// is downloaded.
  barcode,
}
