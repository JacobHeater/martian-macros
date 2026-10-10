import 'package:mm_domain/mm_domain.dart';

import 'portion_unit_label.dart';
import 'quantity_text.dart';
import 'quantity_source_label.dart';

/// A readable line for what was eaten and how the totals came about (MM-167).
/// An entry logged before portions were recorded says so and invents nothing.
String portionSummary(FoodEntry entry) {
  final portion = entry.portion;
  if (portion == null) return '${entry.source.label} · amount not recorded';
  final quantity = portion.quantity;
  final unit = portion.unit;
  if (quantity == null || unit == null) return 'Estimated totals';

  final reference = portion.reference;
  final String amount;
  if (unit == PortionUnit.serving && reference?.servingDescription != null) {
    amount = '${quantityText(quantity)} × ${reference!.servingDescription}';
  } else {
    amount = '${quantityText(quantity)} ${unit.of(quantity)}';
  }
  final grams = unit.isHand
      ? portion.impliedGrams
      : reference == null
      ? null
      : gramsFor(quantity, unit, reference);
  final weight = grams == null || unit.isWeight
      ? ''
      : ' (${quantityText(double.parse(grams.toStringAsFixed(0)))} g)';
  final how = switch (portion.basis) {
    NutritionBasis.enteredTotals =>
      unit.isHand ? 'estimated' : 'totals entered by you',
    NutritionBasis.calculated =>
      reference == null ? 'calculated' : _calculatedFrom(reference),
  };
  return '$amount$weight · $how';
}

String _calculatedFrom(ReferenceNutrition reference) {
  final kcal = quantityText(
    double.parse(reference.nutrition.kcal.toStringAsFixed(0)),
  );
  return switch (reference.basis) {
    ReferenceBasis.per100g => 'calculated from $kcal kcal per 100 g',
    ReferenceBasis.per100ml => 'calculated from $kcal kcal per 100 mL',
    ReferenceBasis.perServing => 'calculated from $kcal kcal per serving',
  };
}
