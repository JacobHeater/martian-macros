import 'calendar_date.dart';
import 'observations.dart';
import 'quantity_source.dart';

enum Meal { breakfast, lunch, dinner, snack }

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
}

/// Energy implied by macros (Atwater 4/4/9).
double atwaterKcal({
  required double proteinG,
  required double carbsG,
  required double fatG,
}) => 4 * proteinG + 4 * carbsG + 9 * fatG;

/// Whether stated energy is consistent with stated macros: within the
/// larger of 15% or 20 kcal. Used to catch typos at entry time.
bool macrosMatchEnergy({
  required double kcal,
  required double proteinG,
  required double carbsG,
  required double fatG,
}) {
  final implied = atwaterKcal(proteinG: proteinG, carbsG: carbsG, fatG: fatG);
  final tolerance = implied * 0.15 > 20 ? implied * 0.15 : 20.0;
  return (kcal - implied).abs() <= tolerance;
}

/// Aggregates one day's entries into the engine's intake observation.
IntakeDay intakeDayFrom(
  CalendarDate date,
  Iterable<FoodEntry> entries, {
  DayCompleteness completeness = DayCompleteness.unmarked,
}) {
  var kcal = 0.0, protein = 0.0, carbs = 0.0, fat = 0.0, weighed = 0.0;
  for (final e in entries) {
    kcal += e.kcal;
    protein += e.proteinG;
    carbs += e.carbsG;
    fat += e.fatG;
    if (e.source == QuantitySource.weighed) weighed += e.kcal;
  }
  return IntakeDay(
    date: date,
    kcal: kcal,
    proteinG: protein,
    carbsG: carbs,
    fatG: fat,
    completeness: completeness,
    relativeSigma: dailyRelativeSigma([
      for (final e in entries) (e.kcal, e.source),
    ]),
    weighedShare: kcal <= 0 ? 0 : weighed / kcal,
  );
}
