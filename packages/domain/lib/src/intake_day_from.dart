import 'calendar_date.dart';
import 'day_completeness.dart';
import 'food_entry.dart';
import 'intake_day.dart';
import 'quantity_source.dart';

/// Aggregates one day's entries into the engine's intake observation.
IntakeDay intakeDayFrom(
  CalendarDate date,
  Iterable<FoodEntry> entries, {
  DayCompleteness completeness = DayCompleteness.unmarked,
}) {
  var kcal = 0.0, protein = 0.0, carbs = 0.0, fat = 0.0, weighed = 0.0;
  var estimated = 0.0;
  for (final e in entries) {
    kcal += e.kcal;
    protein += e.proteinG;
    carbs += e.carbsG;
    fat += e.fatG;
    if (e.source == QuantitySource.weighed) weighed += e.kcal;
    if (e.source == QuantitySource.quickAdd) estimated += e.kcal;
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
    estimatedShare: kcal <= 0 ? 0 : estimated / kcal,
  );
}
