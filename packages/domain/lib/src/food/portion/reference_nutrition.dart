import 'nutrition_totals.dart';
import 'portion_unit.dart';
import 'reference_basis.dart';

/// A food's nutrition for a stated reference amount, with what is known about
/// that amount (MM-167). It is the input to scaling, kept so an entry can say
/// how its totals were worked out.
final class ReferenceNutrition {
  const ReferenceNutrition({
    required this.basis,
    required this.nutrition,
    this.servingDescription,
    this.servingGrams,
    this.servingMilliliters,
    this.servingUnit,
    this.densityGPerMl,
  });

  final ReferenceBasis basis;

  /// The nutrition of one reference amount (100 g, 100 mL or one serving).
  final NutritionTotals nutrition;

  /// "1 cup, chopped": for a per-serving reference, or a serving the food has.
  final String? servingDescription;
  final double? servingGrams;
  final double? servingMilliliters;

  /// The unit the source counts this serving in (a cup, a tablespoon). Eating
  /// that unit scales by the count itself, as the source states it, so a
  /// source's "1 cup (240 mL)" halves exactly, whatever a cup is elsewhere.
  final PortionUnit? servingUnit;

  /// Grams per millilitre, when the food has one. Never guessed.
  final double? densityGPerMl;
}
