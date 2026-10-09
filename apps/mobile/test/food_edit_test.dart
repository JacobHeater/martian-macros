import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-48: correct an entry after logging it, move it, and undo a delete.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.lunch,
        name: 'Chicken and rice',
        kcal: 510,
        proteinG: 51,
        carbsG: 40,
        fatG: 10,
        source: QuantitySource.weighed,
      ),
    );
  });

  Future<void> openFood(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
  }

  Future<List<FoodEntry>> entriesOn(WidgetTester tester, CalendarDate d) =>
      readNow(tester, () => repos.food.watchFood(d).first);

  testWidgets('a number is corrected in place and the meal moved', (
    tester,
  ) async {
    await openFood(tester);
    await tester.tap(find.text('Chicken and rice'));
    await tester.pumpAndSettle();
    expect(find.text('Edit food'), findsOneWidget);
    await tester.enterText(find.byKey(const ValueKey('food-protein')), '15');
    await tester.enterText(find.byKey(const ValueKey('food-kcal')), '310');
    await tester.pump();
    final dinner = find.text('Dinner').last;
    await tester.ensureVisible(dinner);
    await tester.tap(dinner);
    await tester.pump();
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.text('Save changes'));
    await tester.pumpAndSettle();
    final entry = (await entriesOn(tester, today)).single;
    expect(entry.proteinG, 15);
    expect(entry.kcal, 310);
    expect(entry.meal, Meal.dinner);
  });

  testWidgets('an entry can be moved to another day', (tester) async {
    await openFood(tester);
    await tester.tap(find.text('Chicken and rice'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Previous day').last);
    await tester.pump();
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.text('Save changes'));
    await tester.pumpAndSettle();
    expect(await entriesOn(tester, today), isEmpty);
    expect(await entriesOn(tester, today.addDays(-1)), hasLength(1));
  });

  testWidgets('a deleted entry can be put back with Undo', (tester) async {
    await openFood(tester);
    await tester.drag(find.text('Chicken and rice'), const Offset(-600, 0));
    await tester.pumpAndSettle();
    expect(await entriesOn(tester, today), isEmpty);
    await tester.tap(find.text('Undo'));
    await tester.pumpAndSettle();
    final back = (await entriesOn(tester, today)).single;
    expect(back.name, 'Chicken and rice');
    expect(back.proteinG, 51);
    expect(back.meal, Meal.lunch);
  });
}
