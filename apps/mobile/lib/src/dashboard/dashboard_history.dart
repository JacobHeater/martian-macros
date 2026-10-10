import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';

/// Display facts from recorded history, without assigning a score to a day.
final class DashboardHistory {
  DashboardHistory({
    required this.today,
    required this.days,
    required List<IntakeDay> intake,
    required List<TargetsRecord> history,
    required List<Pause> pauses,
    required List<WeightObservation> weights,
    required CalendarDate onboardedOn,
    required bool targetsAllowed,
  }) : start = today.addDays(1 - days) {
    final eligibleStart = onboardedOn.isAfter(start) ? onboardedOn : start;
    for (var i = 0; i < days; i++) {
      final date = start.addDays(i);
      if (date.isBefore(eligibleStart) || pauseOn(pauses, date) != null) continue;
      activeDays++;
      if (!targetsAllowed) continue;
      final record = history
          .where((record) => !record.effectiveFrom.isAfter(date))
          .lastOrNull;
      if (record == null) continue;
      calorieTargets[date] = record.targets.kcal;
      proteinTargets[date] = record.targets.proteinMinimumG ??
          record.targets.proteinG;
    }
    for (final day in intake) {
      if (day.date.isBefore(eligibleStart) || day.date.isAfter(today)) continue;
      if (day.kcal > 0 || day.completeness == DayCompleteness.complete) {
        calories[day.date] = day.kcal;
        protein[day.date] = day.proteinG;
      }
      if (pauseOn(pauses, day.date) != null) continue;
      if (calories.containsKey(day.date)) loggedDays++;
      if (day.completeness == DayCompleteness.complete) completeDays++;
    }
    weighInDays = weights
        .where(
          (w) =>
              !w.date.isBefore(eligibleStart) &&
              !w.date.isAfter(today) &&
              pauseOn(pauses, w.date) == null,
        )
        .map((w) => w.date)
        .toSet()
        .length;
  }

  final CalendarDate today;
  final int days;
  final CalendarDate start;
  final calories = <CalendarDate, double>{};
  final protein = <CalendarDate, double>{};
  final calorieTargets = <CalendarDate, double>{};
  final proteinTargets = <CalendarDate, double>{};
  int activeDays = 0;
  int loggedDays = 0;
  int completeDays = 0;
  int weighInDays = 0;

  double? get meanCalories => _mean(calories.values);
  double? get meanProtein => _mean(protein.values);

  double? _mean(Iterable<double> values) => values.isEmpty
      ? null
      : values.reduce((a, b) => a + b) / values.length;
}
