import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-127: alcohol counts toward calories, is its own line, and is not
/// turned into carbohydrate or fat.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
  });

  Future<void> openFood(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
  }

  Future<void> type(WidgetTester tester, String key, String value) async {
    final finder = find.byKey(ValueKey(key));
    await tester.ensureVisible(finder);
    await tester.enterText(finder, value);
    await tester.pump();
  }

  testWidgets('a day with no alcohol shows no alcohol line', (tester) async {
    await openFood(tester);
    expect(find.byKey(const ValueKey('alcohol-line')), findsNothing);
  });

  testWidgets('a logged drink shows its own line at 7 kcal a gram', (
    tester,
  ) async {
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.dinner,
        name: 'Wine',
        kcal: 153,
        proteinG: 0,
        carbsG: 13,
        fatG: 0,
        source: QuantitySource.labelServing,
        alcoholG: 14,
      ),
    );
    await openFood(tester);
    expect(find.text('Alcohol: 98 kcal'), findsOneWidget);
    // MM-171: room between the line and the meals card below it.
    final line = tester.widget<Padding>(
      find.byKey(const ValueKey('alcohol-line')),
    );
    expect(
      line.padding.resolve(TextDirection.ltr).bottom,
      greaterThanOrEqualTo(8),
    );
  });

  testWidgets('a typed drink saves without a mismatch and keeps its alcohol', (
    tester,
  ) async {
    await openFood(tester);
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Weighed').last);
    await tester.pump();
    await type(tester, 'food-name', 'Two beers');
    await type(tester, 'food-carbs', '26');
    await type(tester, 'food-kcal', '300');
    expect(find.textContaining('Double-check the label'), findsOneWidget);
    // 2 standard drinks: 28 g of alcohol is 196 kcal; 104 + 196 = 300.
    await tester.ensureVisible(find.byKey(const ValueKey('food-add-alcohol')));
    await tester.tap(find.byKey(const ValueKey('food-add-alcohol')));
    await tester.pump();
    await type(tester, 'food-alcohol', '28');
    expect(find.textContaining('Double-check the label'), findsNothing);
    await type(tester, 'portion-quantity', '700');
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    final entry = (await readNow(
      tester,
      () => repos.food.watchFood(today).first,
    )).single;
    expect(entry.alcoholG, 28);
    expect(entry.carbsG, 26, reason: 'alcohol is not turned into carbs');
    expect(entry.fatG, 0);
  });
}
