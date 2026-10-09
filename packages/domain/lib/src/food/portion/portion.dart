import '../../quantity_source.dart';
import 'nutrition_basis.dart';
import 'portion_unit.dart';
import 'reference_nutrition.dart';

/// How much of a food was eaten and what the entry's numbers are for
/// (MM-167). It travels with an entry's totals so the portion can be read
/// back and the totals understood.
///
/// An Estimate has no quantity or unit. A hand portion is a count only, with
/// no [reference] until the hand model exists (MM-46). Entries logged before
/// portions existed have no [Portion] at all, and nothing is invented for them.
final class Portion {
  const Portion({
    required this.method,
    required this.basis,
    this.quantity,
    this.unit,
    this.reference,
  });

  final QuantitySource method;
  final NutritionBasis basis;

  /// Greater than zero when present; null only for an Estimate.
  final double? quantity;
  final PortionUnit? unit;

  /// The reference nutrition the totals were calculated from, for a
  /// calculated entry.
  final ReferenceNutrition? reference;
}
