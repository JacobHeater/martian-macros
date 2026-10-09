import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food/entries_copied_to.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-47: copy yesterday, copy one meal to today.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  FoodEntry entry(CalendarDate on, Meal meal, String name) => FoodEntry(
    id: 0,
    date: on,
    meal: meal,
    name: name,
    kcal: 300,
    proteinG: 20,
    carbsG: 30,
    fatG: 10,
    source: QuantitySource.weighed,
  );

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
    final y = today.addDays(-1);
    await repos.food.addFood(entry(y, Meal.breakfast, 'Oats'));
    await repos.food.addFood(entry(y, Meal.breakfast, 'Eggs'));
    await repos.food.addFood(entry(y, Meal.dinner, 'Pasta'));
    await repos.dayMarks.setCompleteness(y, DayCompleteness.complete);
  });

  Future<void> openFood(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
  }

  test('copies are new entries on the day, in the same or a given meal', () {
    final copies = entriesCopiedTo(today, [
      entry(today.addDays(-1), Meal.dinner, 'Pasta'),
    ]);
    expect(copies.single.id, 0);
    expect(copies.single.date, today);
    expect(copies.single.meal, Meal.dinner);
    expect(
      entriesCopiedTo(today, [
        entry(today, Meal.dinner, 'Pasta'),
      ], meal: Meal.lunch).single.meal,
      Meal.lunch,
    );
  });

  testWidgets('Copy yesterday fills an empty day and leaves it unmarked', (
    tester,
  ) async {
    await openFood(tester);
    await tester.tap(find.text('Copy yesterday'));
    await tester.pumpAndSettle();
    final copied = await readNow(
      tester,
      () => repos.food.watchFood(today).first,
    );
    expect(
      [for (final e in copied) '${e.meal.name}:${e.name}'],
      ['breakfast:Oats', 'breakfast:Eggs', 'dinner:Pasta'],
    );
    final mark = await readNow(
      tester,
      () => repos.dayMarks.watchCompleteness(today).first,
    );
    expect(mark, DayCompleteness.unmarked);
    expect(find.text('Copy yesterday'), findsNothing);
  });

  testWidgets('one meal from a past day copies to today', (tester) async {
    await openFood(tester);
    await tester.tap(find.byTooltip('Previous day'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Copy breakfast to today'));
    await tester.pumpAndSettle();
    final copied = await readNow(
      tester,
      () => repos.food.watchFood(today).first,
    );
    expect([for (final e in copied) e.name], ['Oats', 'Eggs']);
  });
}
