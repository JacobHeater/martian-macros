import 'grams_for.dart';
import 'nutrition_totals.dart';
import 'portion_unit.dart';
import 'reference_basis.dart';
import 'reference_nutrition.dart';

/// Totals for eating [quantity] of [unit] of the food described by
/// [reference], or null when the amount cannot be turned into the reference's
/// basis without guessing (MM-167).
///
/// This is the one place a quantity scales nutrition. It is applied once, to
/// reference values; totals the user typed are never passed through it.
NutritionTotals? scaleNutrition(
  double quantity,
  PortionUnit unit,
  ReferenceNutrition reference,
) {
  if (!(quantity > 0) || !quantity.isFinite) return null;
  switch (reference.basis) {
    case ReferenceBasis.perServing:
      if (unit == PortionUnit.serving || unit == reference.servingUnit) {
        return reference.nutrition.times(quantity);
      }
      final servingGrams = reference.servingGrams;
      final servingMl = reference.servingMilliliters;
      final ml = unit.milliliters;
      if (ml != null && servingMl != null && servingMl > 0) {
        return reference.nutrition.times(quantity * ml / servingMl);
      }
      final grams = gramsFor(quantity, unit, reference);
      if (grams != null && servingGrams != null && servingGrams > 0) {
        return reference.nutrition.times(grams / servingGrams);
      }
      return null;
    case ReferenceBasis.per100g:
      final grams = gramsFor(quantity, unit, reference);
      return grams == null ? null : reference.nutrition.times(grams / 100);
    case ReferenceBasis.per100ml:
      final ml = unit.milliliters;
      if (ml != null) return reference.nutrition.times(quantity * ml / 100);
      final grams = unit.grams;
      final density = reference.densityGPerMl;
      if (grams != null && density != null && density > 0) {
        return reference.nutrition.times(quantity * grams / density / 100);
      }
      return null;
  }
}
