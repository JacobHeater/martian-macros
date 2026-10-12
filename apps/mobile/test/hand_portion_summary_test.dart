import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food_packs/food_catalog_provider.dart';
import 'package:martian_macros/src/format/portion_summary.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'support/pump_app.dart';

/// MM-217: MM-167 says a hand portion "is never presented as exact" and gives
/// "2 cupped hands, estimated" as how it reads. A found food logged by palm
/// reads as an amount with a weight "calculated from" its reference, with no
/// word that the weight is an estimate.
void main() {
  final today = CalendarDate(2026, 10, 5);

  testWidgets(
    'a found food logged by palm reads as an estimate',
    (tester) async {
      final repos = InMemoryRepositories();
      await repos.setup.saveSetup(
        typicalSetup(onboardedOn: today.addDays(-40)),
      );
      await repos.weights.saveWeight(today, 82);
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
      await tester.enterText(
        find.byKey(const ValueKey('food-search')),
        'banana',
      );
      await tester.pumpAndSettle();
      await tester.tap(find.textContaining('Banana').first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Palms'));
      await tester.pump();
      await tester.tap(find.byKey(const ValueKey('amount-log')));
      await tester.pumpAndSettle();

      final entry = (await readNow(
        tester,
        () => repos.food.watchFood(today).first,
      )).single;
      expect(entry.portion!.unit, PortionUnit.palm);
      expect(portionSummary(entry).toLowerCase(), contains('estimat'));
    },
    // Fails today: the line says "calculated from", not estimated. Enable
    // with the fix (MM-217).
    skip: true,
  );
}
