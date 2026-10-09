import 'calendar_date.dart';
import 'food/portion/portion.dart';
import 'meal.dart';
import 'quantity_source.dart';

/// One logged food item.
final class FoodEntry {
  const FoodEntry({
    required this.id,
    required this.date,
    required this.meal,
    required this.name,
    required this.kcal,
    required this.proteinG,
    required this.carbsG,
    required this.fatG,
    required this.source,
    this.portion,
    this.fiberG,
    this.sodiumMg,
    this.alcoholG,
  });

  /// Database id; 0 for an entry not yet saved.
  final int id;
  final CalendarDate date;
  final Meal meal;
  final String name;
  final double kcal;
  final double proteinG;
  final double carbsG;
  final double fatG;
  final QuantitySource source;

  /// How much was eaten and what the totals are for (MM-167). Null for an
  /// entry logged before portions were recorded, and nothing is invented for
  /// it. When present, its method is [source].
  final Portion? portion;

  /// Nutrients beyond the four macros, kept when the source states them and
  /// shown at Full detail (MM-49). Null means not known, never zero.
  final double? fiberG;
  final double? sodiumMg;
  final double? alcoholG;

  /// Carbohydrate less fiber, or null when fiber is not known.
  double? get netCarbsG {
    final fiber = fiberG;
    return fiber == null ? null : (carbsG - fiber).clamp(0, double.infinity);
  }
}
