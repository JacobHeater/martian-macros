import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'candidate_food.dart';

/// The pack entry for [food] with pack id [id].
///
/// The trust tier is provisional until MM-153 settles it: analysed USDA foods
/// are `reference`, USDA branded data is `label`, and Open Food Facts data, or
/// anything two sources disagree about, is `checkThis`. No food is ever
/// called verified.
PackEntry packEntryFor(
  CandidateFood food, {
  required int id,
  required String packId,
  String? gtin14,
  String? disagreement,
  PreparationState preparation = PreparationState.unspecified,
  int? pairedFoodId,
}) {
  final (tier, reason) = disagreement != null
      ? (TrustTier.checkThis, disagreement)
      : switch (food.source) {
          'usda_foundation' || 'usda_sr_legacy' => (
            TrustTier.reference,
            'Analysed food data from USDA FoodData Central.',
          ),
          'usda_branded' => (
            TrustTier.label,
            'Label data submitted by the manufacturer to USDA.',
          ),
          _ => (
            TrustTier.checkThis,
            'Entered by Open Food Facts contributors and not checked '
                'against a package.',
          ),
        };
  return PackEntry(
    food: CatalogFood(
      id: id,
      packId: packId,
      name: food.name.trim(),
      brand: food.brand,
      kcal: food.kcal!,
      proteinG: food.proteinG!,
      carbsG: food.carbsG!,
      fatG: food.fatG!,
      fiberG: food.fiberG,
      sodiumMg: food.sodiumMg,
      alcoholG: food.alcoholG,
      source: food.source,
      preparation: preparation,
      pairedFoodId: pairedFoodId,
      sourceId: food.sourceId,
      tier: tier,
      tierReason: reason,
    ),
    servings: food.servings,
    barcodes: [?gtin14],
  );
}
