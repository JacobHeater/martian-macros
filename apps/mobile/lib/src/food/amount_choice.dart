import 'package:mm_domain/mm_domain.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

/// A way of stating the amount of a database food: one of its servings, or a
/// weight (MM-167).
final class AmountChoice {
  const AmountChoice(this.unit, this.serving);

  final PortionUnit unit;
  final CatalogServing? serving;
}
