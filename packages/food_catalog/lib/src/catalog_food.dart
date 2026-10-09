import 'preparation_state.dart';
import 'trust_tier.dart';

/// One food as a pack states it, per 100 g.
final class CatalogFood {
  const CatalogFood({
    required this.id,
    required this.packId,
    required this.name,
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    required this.source,
    required this.tier,
    required this.tierReason,
    this.brand,
    this.fiberG,
    this.sodiumMg,
    this.alcoholG,
    this.preparation = PreparationState.unspecified,
    this.pairedFoodId,
    this.densityGPerMl,
    this.sourceId,
  });

  /// Unique within its pack.
  final int id;
  final String packId;
  final String name;
  final String? brand;
  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final double? fiberG;
  final double? sodiumMg;
  final double? alcoholG;
  final PreparationState preparation;

  /// The raw food of a cooked one, or the cooked of a raw one.
  final int? pairedFoodId;

  /// Grams per millilitre, for foods measured by volume.
  final double? densityGPerMl;
  final String source;

  /// The food's id in that source (a USDA `fdc_id`, an Open Food Facts
  /// `code`), so a pack entry can be traced back to where it came from.
  final String? sourceId;
  final TrustTier tier;

  /// Why it has that tier, in a sentence.
  final String tierReason;
}
