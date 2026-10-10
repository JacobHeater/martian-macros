import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food_packs/food_catalog_provider.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'support/pump_app.dart';

/// MM-151: weighing a cooked food against a raw entry is the biggest avoidable
/// error, so a food with both states offers a switch while logging by weight.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
  });

  Future<void> pick(WidgetTester tester, String query, String name) async {
    await pumpApp(
      tester,
      repos,
      FixedClock(today),
      overrides: [
        foodCatalogProvider.overrideWith(
          (ref) async => FoodCatalog([
            SqliteFoodPack.fromDatabase(
              const FoodPackWriter().writeInMemory(
                FixturePack.header,
                FixturePack.entries,
              ),
            ),
          ]),
        ),
      ],
    );
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('food-search')), query);
    await tester.pumpAndSettle();
    await tester.tap(find.text(name).first);
    await tester.pumpAndSettle();
  }

  testWidgets('rice weighed cooked can be switched to raw, with both shown', (
    tester,
  ) async {
    await pick(tester, 'white rice', 'White rice, cooked');
    await tester.tap(find.text('Grams'));
    await tester.pump();
    await tester.enterText(
      find.byKey(const ValueKey('amount-quantity')),
      '200',
    );
    await tester.pump();
    expect(find.text('Weighed as'), findsOneWidget);
    expect(
      find.text('200 g cooked is about 260 kcal. 200 g raw is about 730 kcal.'),
      findsOneWidget,
    );
    expect(find.textContaining('260 kcal ·'), findsOneWidget);

    await tester.tap(find.text('Raw'));
    await tester.pump();
    expect(find.textContaining('730 kcal ·'), findsOneWidget);
    await tester.ensureVisible(find.byKey(const ValueKey('amount-log')));
    await tester.tap(find.byKey(const ValueKey('amount-log')));
    await tester.pumpAndSettle();
    final entry = (await readNow(
      tester,
      () => repos.food.watchFood(today).first,
    )).single;
    expect(entry.name, 'White rice, raw');
    expect(entry.kcal, closeTo(730, 1e-9));
    expect(entry.portion!.reference!.nutrition.kcal, 365);
  });

  testWidgets('the state last used is preselected next time', (tester) async {
    await pick(tester, 'white rice', 'White rice, cooked');
    await tester.tap(find.text('Grams'));
    await tester.pump();
    await tester.tap(find.text('Raw'));
    await tester.pump();
    await tester.ensureVisible(find.byKey(const ValueKey('amount-log')));
    await tester.tap(find.byKey(const ValueKey('amount-log')));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
    await tester.enterText(
      find.byKey(const ValueKey('food-search')),
      'white rice',
    );
    await tester.pumpAndSettle();
    await tester.tap(find.text('White rice, cooked').first);
    await tester.pumpAndSettle();
    // 100 g of the raw entry (365 kcal), not the cooked one (130).
    expect(find.text('Weighed as'), findsOneWidget);
    expect(find.textContaining('365 kcal ·'), findsOneWidget);
  });

  testWidgets('no switch for a serving, or for a food with one state', (
    tester,
  ) async {
    await pick(tester, 'white rice', 'White rice, cooked');
    expect(find.text('Weighed as'), findsNothing, reason: 'a serving');
    await tester.tap(find.text('Back to search'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('food-search')), 'banana');
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Banana').first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Grams'));
    await tester.pump();
    expect(find.text('Weighed as'), findsNothing, reason: 'one state only');
  });
}
