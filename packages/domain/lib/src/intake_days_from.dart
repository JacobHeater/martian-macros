import 'calendar_date.dart';
import 'day_completeness.dart';
import 'food_entry.dart';
import 'intake_day.dart';
import 'intake_day_from.dart';

/// One intake observation per day that has any food logged, oldest first.
///
/// Both the database and the in-memory repositories use this, so they cannot
/// disagree about how a day's intake is formed. [completenessByEpochDay] is
/// keyed by [CalendarDate.epochDay].
List<IntakeDay> intakeDaysFrom(
  Iterable<FoodEntry> entries,
  Map<int, DayCompleteness> completenessByEpochDay,
) {
  final byDay = <int, List<FoodEntry>>{};
  for (final e in entries) {
    byDay.putIfAbsent(e.date.epochDay, () => []).add(e);
  }
  final days = byDay.keys.toList()..sort();
  return [
    for (final day in days)
      intakeDayFrom(
        CalendarDate.fromEpochDay(day),
        byDay[day]!,
        completeness: completenessByEpochDay[day] ?? DayCompleteness.unmarked,
      ),
  ];
}
