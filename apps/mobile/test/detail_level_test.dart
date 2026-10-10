import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-49: the Detail setting changes what is shown, never what is stored.
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
        name: 'Lentils',
        kcal: 230,
        proteinG: 18,
        carbsG: 40,
        fatG: 1,
        source: QuantitySource.weighed,
        fiberG: 16,
        sodiumMg: 4,
      ),
    );
  });

  Future<void> openFood(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
  }

  testWidgets('Standard shows the macros and no extras', (tester) async {
    await openFood(tester);
    expect(find.text('Carbs'), findsWidgets);
    expect(find.textContaining('P 18 · C 40 · F 1'), findsOneWidget);
    expect(find.byKey(const ValueKey('entry-extras')), findsNothing);
  });

  testWidgets('Full reveals what was stored all along', (tester) async {
    await repos.preferences.saveDetailLevel(DetailLevel.full);
    await openFood(tester);
    expect(find.textContaining('Fiber 16 g'), findsOneWidget);
    expect(find.textContaining('Net carbs 24 g'), findsOneWidget);
    expect(find.textContaining('Sodium 4 mg'), findsOneWidget);
  });

  testWidgets('Simple hides carbohydrate and fat, not the data', (
    tester,
  ) async {
    await repos.preferences.saveDetailLevel(DetailLevel.simple);
    await openFood(tester);
    expect(find.text('P 18'), findsOneWidget);
    expect(find.text('Carbs'), findsNothing);
    expect(find.text('Fat'), findsNothing);
    expect(find.textContaining('C 40'), findsNothing);
    final stored = await readNow(
      tester,
      () => repos.food.watchFood(today).first,
    );
    expect(stored.single.carbsG, 40);
    expect(stored.single.fatG, 1);
  });

  testWidgets(
    'the fiber line shows at Full, with its guide, never at Standard',
    (tester) async {
      await openFood(tester);
      expect(find.byKey(const ValueKey('fiber-line')), findsNothing);
    },
  );

  testWidgets('Full shows fiber against the guide', (tester) async {
    await repos.preferences.saveDetailLevel(DetailLevel.full);
    await openFood(tester);
    expect(find.textContaining('Fiber: 16 g · guide'), findsOneWidget);
  });

  testWidgets('too little fiber data says so rather than a total', (
    tester,
  ) async {
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.dinner,
        name: 'Typed meal',
        kcal: 800,
        proteinG: 30,
        carbsG: 80,
        fatG: 30,
        source: QuantitySource.quickAdd,
      ),
    );
    await repos.preferences.saveDetailLevel(DetailLevel.full);
    await openFood(tester);
    expect(find.text('Fiber: not enough data'), findsOneWidget);
  });
}
