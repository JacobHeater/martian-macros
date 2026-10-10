import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-125: each meal shows its protein, with a quiet marker and no target.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  Future<void> eat(Meal meal, String name, double proteinG) =>
      repos.food.addFood(
        FoodEntry(
          id: 0,
          date: today,
          meal: meal,
          name: name,
          kcal: 400,
          proteinG: proteinG,
          carbsG: 30,
          fatG: 10,
          source: QuantitySource.weighed,
        ),
      );

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    // 80 kg: the marker is at 24 g.
    await repos.weights.saveWeight(today, 80);
    await eat(Meal.breakfast, 'Toast', 6);
    await eat(Meal.lunch, 'Chicken', 30);
  });

  Future<void> openFood(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
  }

  testWidgets('at Full, a lunch with 30 g carries the marker', (tester) async {
    await repos.preferences.saveDetailLevel(DetailLevel.full);
    await openFood(tester);
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('protein-marker-lunch')),
      200,
    );
    expect(find.byKey(const ValueKey('protein-marker-lunch')), findsOneWidget);
    expect(find.textContaining('30 g protein'), findsOneWidget);
  });

  testWidgets('a meal without it shows nothing in its place', (tester) async {
    await repos.preferences.saveDetailLevel(DetailLevel.full);
    await openFood(tester);
    expect(
      find.byKey(const ValueKey('protein-marker-breakfast')),
      findsNothing,
    );
    expect(find.textContaining('6 g protein'), findsOneWidget);
  });

  testWidgets('at Standard no meal has a marker', (tester) async {
    await openFood(tester);
    for (final meal in Meal.values) {
      expect(find.byKey(ValueKey('protein-marker-${meal.name}')), findsNothing);
    }
    expect(find.textContaining('g protein'), findsNothing);
  });

  testWidgets('no meal ever shows a protein target', (tester) async {
    await repos.preferences.saveDetailLevel(DetailLevel.full);
    await openFood(tester);
    final headers = tester
        .widgetList<Text>(find.textContaining('g protein'))
        .map((t) => t.data ?? '')
        .join(' ')
        .toLowerCase();
    for (final word in ['target', 'of ', '/', 'goal', 'min']) {
      expect(headers, isNot(contains(word)), reason: word);
    }
  });
}
