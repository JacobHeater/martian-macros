import 'package:mm_domain/mm_domain.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

/// A saved food shown as the catalog food the amount step and trust mark
/// understand (MM-45). Per-100 g numbers follow from its serving weight; with
/// no serving weight the figures are per serving and only servings are
/// offered.
CatalogFood customCatalogFood(CustomFood food) {
  final grams = food.servingGrams;
  final scale = grams == null ? 1.0 : 100 / grams;
  return CatalogFood(
    id: food.id,
    packId: 'custom',
    name: food.name,
    kcal: food.perServing.kcal * scale,
    proteinG: food.perServing.proteinG * scale,
    carbsG: food.perServing.carbsG * scale,
    fatG: food.perServing.fatG * scale,
    source: 'user',
    tier: TrustTier.label,
    tierReason: 'Entered by you.',
  );
}
