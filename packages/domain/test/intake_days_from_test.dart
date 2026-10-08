import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

FoodEntry _food(
  String name,
  double kcal,
  CalendarDate date, {
  QuantitySource source = QuantitySource.labelServing,
}) => FoodEntry(
  id: 0,
  date: date,
  meal: Meal.lunch,
  name: name,
  kcal: kcal,
  proteinG: kcal * 0.3 / 4,
  carbsG: kcal * 0.4 / 4,
  fatG: kcal * 0.3 / 9,
  source: source,
);

void main() {
  final day = CalendarDate(2026, 10, 5);

  test('aggregates days with marks and measurement quality', () {
    final days = intakeDaysFrom(
      [
        _food('A', 600, day, source: QuantitySource.weighed),
        _food('B', 400, day, source: QuantitySource.palm),
        _food('C', 500, day.addDays(-1)),
      ],
      {day.epochDay: DayCompleteness.complete},
    );
    expect(days.map((d) => d.date.epochDay), [
      day.addDays(-1).epochDay,
      day.epochDay,
    ]);
    final today = days.last;
    expect(today.kcal, 1000);
    expect(today.completeness, DayCompleteness.complete);
    expect(today.weighedShare, closeTo(0.6, 1e-9));
    // sqrt((600*.05)^2 + (400*.25)^2) / 1000
    expect(today.relativeSigma, closeTo(0.1044, 1e-4));
    expect(days.first.completeness, DayCompleteness.unmarked);
  });

  test('no entries, no days', () {
    expect(intakeDaysFrom(const [], const {}), isEmpty);
  });
}
