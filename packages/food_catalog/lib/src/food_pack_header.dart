/// What a pack says about itself: where it came from and under what terms.
final class FoodPackHeader {
  const FoodPackHeader({
    required this.packId,
    required this.formatVersion,
    required this.builtOn,
    required this.region,
    required this.sources,
    required this.license,
    required this.attribution,
  });

  /// Names the pack, so a food can say which pack it came from.
  final String packId;
  final int formatVersion;

  /// An ISO date, `2026-10-09`.
  final String builtOn;
  final String region;

  /// Each source and its version, e.g. `USDA FoodData Central 2026-04`.
  final List<String> sources;
  final String license;
  final String attribution;
}
