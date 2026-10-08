import 'package:mm_domain/mm_domain.dart';
import 'package:test/test.dart';

import 'expect_change_emits.dart';

FoodEntry _entry(CalendarDate date, double kcal) => FoodEntry(
  id: 0,
  date: date,
  meal: Meal.dinner,
  name: 'Food',
  kcal: kcal,
  proteinG: 20,
  carbsG: 30,
  fatG: 10,
  source: QuantitySource.weighed,
);

/// What every [IntakeReader] must do. [create] returns an intake reader and
/// the food log and day marks it derives from.
void intakeReaderContract(
  String name,
  ({FoodRepository food, DayMarkRepository marks, IntakeReader intake})
  Function()
  create,
) {
  group('$name as an IntakeReader', () {
    late FoodRepository food;
    late DayMarkRepository marks;
    late IntakeReader intake;
    final d1 = CalendarDate(2026, 1, 1);
    final d2 = CalendarDate(2026, 1, 2);
    final d3 = CalendarDate(2026, 1, 3);

    setUp(() {
      final made = create();
      food = made.food;
      marks = made.marks;
      intake = made.intake;
    });

    test('no food, no intake days', () async {
      expect(await intake.watchIntakeDays(since: d1).first, isEmpty);
    });

    test('sums each day with food, oldest first', () async {
      await food.addFood(_entry(d2, 500));
      await food.addFood(_entry(d1, 300));
      await food.addFood(_entry(d1, 200));
      final days = await intake.watchIntakeDays(since: d1).first;
      expect(
        [for (final d in days) d.date.epochDay],
        [d1.epochDay, d2.epochDay],
      );
      expect([for (final d in days) d.kcal], [500, 500]);
      expect(days.first.proteinG, 40);
    });

    test('leaves out days before since', () async {
      await food.addFood(_entry(d1, 300));
      await food.addFood(_entry(d3, 400));
      final days = await intake.watchIntakeDays(since: d2).first;
      expect([for (final d in days) d.date.epochDay], [d3.epochDay]);
    });

    test('carries the completeness mark of the day', () async {
      await food.addFood(_entry(d1, 300));
      await marks.setCompleteness(d1, DayCompleteness.partial);
      final days = await intake.watchIntakeDays(since: d1).first;
      expect(days.single.completeness, DayCompleteness.partial);
    });

    test('changes when the food log changes', () async {
      await expectChangeEmits(
        intake.watchIntakeDays(since: d1).map((l) => l.length),
        before: 0,
        change: () => food.addFood(_entry(d1, 300)),
        after: 1,
      );
    });
  });
}
