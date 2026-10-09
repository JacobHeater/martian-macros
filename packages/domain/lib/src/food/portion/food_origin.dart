/// Which food an entry was logged from (MM-167), so the same food can be
/// found again, a raw or cooked choice remembered (MM-151), and a figure traced
/// back to where it came from.
final class FoodOrigin {
  const FoodOrigin({
    required this.packId,
    required this.foodId,
    required this.source,
    this.sourceId,
  });

  /// The food pack, or `custom` for a food the user saved.
  final String packId;

  /// The food's id within that pack.
  final int foodId;

  /// Where the pack got it (`usda_sr`, `off`, `user`, ...).
  final String source;

  /// The food's id in that source, where it has one.
  final String? sourceId;

  @override
  bool operator ==(Object other) =>
      other is FoodOrigin &&
      other.packId == packId &&
      other.foodId == foodId &&
      other.source == source &&
      other.sourceId == sourceId;

  @override
  int get hashCode => Object.hash(packId, foodId, source, sourceId);
}
