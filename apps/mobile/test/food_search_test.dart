import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food_packs/food_catalog_provider.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'support/pump_app.dart';

/// MM-42: finding a food in the installed packs, choosing an amount and
/// logging it. The packs are the fixture pack, on the phone and offline.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
  });

  Future<void> openSheet(WidgetTester tester, {bool packs = true}) async {
    await pumpApp(
      tester,
      repos,
      FixedClock(today),
      overrides: [
        foodCatalogProvider.overrideWith(
          (ref) async => FoodCatalog([
            if (packs)
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
  }

  testWidgets('a searched food is logged by serving with scaled macros', (
    tester,
  ) async {
    await openSheet(tester);
    await tester.enterText(find.byKey(const ValueKey('food-search')), 'banana');
    await tester.pumpAndSettle();
    expect(find.textContaining('Reference'), findsWidgets);
    await tester.tap(find.textContaining('Banana').first);
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('amount-quantity')), '2');
    await tester.pump();
    // 2 x 118 g at 89 kcal per 100 g.
    expect(find.textContaining('210 kcal'), findsOneWidget);
    await tester.tap(find.byKey(const ValueKey('amount-log')));
    await tester.pumpAndSettle();
    final logged = await readNow(
      tester,
      () => repos.food.watchFood(today).first,
    );
    expect(logged.single.name, 'Banana');
    expect(logged.single.kcal, closeTo(210.04, 0.01));
    expect(logged.single.source, QuantitySource.householdMeasure);
  });

  testWidgets('with nothing found the sheet offers manual entry', (
    tester,
  ) async {
    await openSheet(tester);
    await tester.enterText(find.byKey(const ValueKey('food-search')), 'zzzzq');
    await tester.pumpAndSettle();
    expect(find.textContaining('Nothing found'), findsOneWidget);
    await tester.tap(find.text('Enter manually'));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('food-kcal')), findsOneWidget);
  });

  testWidgets('with no pack installed it says where to get one', (
    tester,
  ) async {
    await openSheet(tester, packs: false);
    await tester.enterText(find.byKey(const ValueKey('food-search')), 'banana');
    await tester.pumpAndSettle();
    expect(
      find.textContaining('No food database is on this phone'),
      findsOneWidget,
    );
  });
}
