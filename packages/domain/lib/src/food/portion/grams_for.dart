import 'portion_unit.dart';
import 'reference_nutrition.dart';

/// The grams in [quantity] of [unit] of the food described by [reference], or
/// null when that cannot be known without guessing (MM-167).
///
/// A weight is exact. A volume converts only through the food's own density,
/// or through a serving the source defines in both volume and weight; there is
/// no generic density. A serving converts only when it has a gram weight. A
/// hand portion never converts here: it needs the hand model (MM-46).
double? gramsFor(
  double quantity,
  PortionUnit unit,
  ReferenceNutrition reference,
) {
  final servingGrams0 = reference.servingGrams;
  if (servingGrams0 != null && unit == reference.servingUnit) {
    return quantity * servingGrams0;
  }
  final weight = unit.grams;
  if (weight != null) return quantity * weight;
  final ml = unit.milliliters;
  if (ml != null) {
    final volume = quantity * ml;
    final density = reference.densityGPerMl;
    if (density != null) return volume * density;
    final servingMl = reference.servingMilliliters;
    final servingGrams = reference.servingGrams;
    if (servingMl != null && servingGrams != null && servingMl > 0) {
      return volume / servingMl * servingGrams;
    }
    return null;
  }
  if (unit == PortionUnit.serving) {
    final servingGrams = reference.servingGrams;
    return servingGrams == null ? null : quantity * servingGrams;
  }
  return null;
}
