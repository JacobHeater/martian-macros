import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food_packs/food_catalog_provider.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'support/pump_app.dart';

/// MM-167: quantity, unit and what the typed numbers are for, in the add-food
/// sheet, the amount step and the editor.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
  });

  Future<void> openFood(WidgetTester tester) async {
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
  }

  Future<void> openSheet(WidgetTester tester) async {
    await openFood(tester);
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
  }

  Future<void> type(WidgetTester tester, String key, String value) async {
    final finder = find.byKey(ValueKey(key));
    await tester.ensureVisible(finder);
    await tester.enterText(finder, value);
    await tester.pump();
  }

  Future<void> tapText(WidgetTester tester, String label) async {
    final finder = find.text(label).last;
    await tester.ensureVisible(finder);
    await tester.tap(finder);
    await tester.pump();
  }

  Future<List<FoodEntry>> logged(WidgetTester tester) =>
      readNow(tester, () => repos.food.watchFood(today).first);

  bool canLog(WidgetTester tester, String key) {
    final button = tester.widget<FilledButton>(
      find.descendant(
        of: find.byKey(ValueKey(key)),
        matching: find.byType(FilledButton),
      ),
    );
    return button.onPressed != null;
  }

  Future<void> manual(
    WidgetTester tester, {
    String name = 'Stew',
    String kcal = '400',
  }) async {
    await type(tester, 'food-name', name);
    await type(tester, 'food-kcal', kcal);
  }

  testWidgets('Weighed asks for an amount and a weight unit', (tester) async {
    await openSheet(tester);
    await tapText(tester, 'Weighed');
    expect(find.text('Grams'), findsOneWidget);
    expect(find.text('Ounces'), findsOneWidget);
    await manual(tester);
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    expect(canLog(tester, 'food-save'), isFalse, reason: 'no amount yet');
    expect(find.text('How much did you eat?'), findsOneWidget);

    await tapText(tester, 'Ounces');
    await type(tester, 'portion-quantity', '6');
    expect(canLog(tester, 'food-save'), isTrue);
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();

    final entry = (await logged(tester)).single;
    expect(entry.portion!.quantity, 6);
    expect(entry.portion!.unit, PortionUnit.ounce);
    expect(entry.portion!.method, QuantitySource.weighed);
    expect(entry.portion!.basis, NutritionBasis.enteredTotals);
    expect(entry.kcal, 400, reason: 'typed totals are not scaled by 6 oz');
  });

  testWidgets('invalid amounts are refused with a reason', (tester) async {
    await openSheet(tester);
    await tapText(tester, 'Weighed');
    await manual(tester);
    for (final bad in ['0', '-2', 'abc']) {
      await type(tester, 'portion-quantity', bad);
      expect(canLog(tester, 'food-save'), isFalse, reason: bad);
      expect(find.text('An amount above zero is needed.'), findsOneWidget);
    }
    await type(tester, 'portion-quantity', '1 1/2');
    expect(canLog(tester, 'food-save'), isTrue, reason: 'a fraction is fine');
  });

  testWidgets('typed totals are never multiplied by the servings', (
    tester,
  ) async {
    await openSheet(tester);
    expect(find.text('Everything you ate'), findsNothing);
    expect(find.text('Everything I ate'), findsOneWidget);
    await manual(tester);
    await type(tester, 'portion-quantity', '2');
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    final entry = (await logged(tester)).single;
    expect(entry.kcal, 400);
    expect(entry.portion!.quantity, 2);
    expect(entry.portion!.unit, PortionUnit.serving);
    expect(entry.portion!.basis, NutritionBasis.enteredTotals);
  });

  testWidgets('one serving as the basis scales the typed numbers', (
    tester,
  ) async {
    await openSheet(tester);
    await tapText(tester, 'One serving');
    await manual(tester, name: 'Bar', kcal: '160');
    await type(tester, 'food-protein', '10');
    await type(tester, 'portion-quantity', '1.5');
    expect(find.textContaining('Logs 240 kcal'), findsOneWidget);
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    final entry = (await logged(tester)).single;
    expect(entry.kcal, 240);
    expect(entry.proteinG, 15);
    expect(entry.source, QuantitySource.labelServing);
    final p = entry.portion!;
    expect(p.basis, NutritionBasis.calculated);
    expect(p.quantity, 1.5);
    expect(p.reference!.basis, ReferenceBasis.perServing);
    expect(p.reference!.nutrition.kcal, 160);
  });

  testWidgets('cups take a fraction and a volume unit', (tester) async {
    await openSheet(tester);
    await tapText(tester, 'Cup / spoon');
    expect(find.text('Cups'), findsOneWidget);
    expect(find.text('Tablespoons'), findsOneWidget);
    await tapText(tester, 'Cups');
    await manual(tester);
    await type(tester, 'portion-quantity', '1/2');
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    final p = (await logged(tester)).single.portion!;
    expect(p.quantity, 0.5);
    expect(p.unit, PortionUnit.cup);
    expect(p.method, QuantitySource.householdMeasure);
  });

  testWidgets('cupped hands are a count of an estimated portion', (
    tester,
  ) async {
    await openSheet(tester);
    await tapText(tester, 'Cupped hand');
    await manual(tester);
    await type(tester, 'portion-quantity', '2');
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    final entry = (await logged(tester)).single;
    expect(entry.portion!.quantity, 2);
    expect(entry.portion!.unit, PortionUnit.cuppedHand);
    expect(entry.kcal, 400);
    expect(find.textContaining('2 cupped hands · estimated'), findsOneWidget);
  });

  testWidgets('Estimate has no amount or unit', (tester) async {
    await openSheet(tester);
    await tapText(tester, 'Estimate');
    expect(find.byKey(const ValueKey('portion-quantity')), findsNothing);
    expect(
      find.text('Enter calories and macros for everything you ate.'),
      findsOneWidget,
    );
    await manual(tester);
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    final p = (await logged(tester)).single.portion!;
    expect(p.method, QuantitySource.quickAdd);
    expect(p.quantity, isNull);
    expect(p.unit, isNull);
    expect(find.text('Estimated totals'), findsOneWidget);
  });

  testWidgets('changing the method clears the amount', (tester) async {
    await openSheet(tester);
    await tapText(tester, 'Weighed');
    await type(tester, 'portion-quantity', '150');
    await tapText(tester, 'Cup / spoon');
    final field = tester.widget<TextField>(
      find.descendant(
        of: find.byKey(const ValueKey('portion-quantity')),
        matching: find.byType(TextField),
      ),
    );
    expect(field.controller!.text, isEmpty);
    expect(find.text('Cups'), findsOneWidget);
    expect(find.text('Grams'), findsNothing);
  });

  testWidgets('a searched food is logged by weight and calculated', (
    tester,
  ) async {
    await openSheet(tester);
    await type(tester, 'food-search', 'banana');
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Banana').first);
    await tester.pumpAndSettle();
    await tapText(tester, 'Grams');
    await type(tester, 'amount-quantity', '150');
    expect(find.textContaining('134 kcal'), findsOneWidget);
    await tester.ensureVisible(find.byKey(const ValueKey('amount-log')));
    await tester.tap(find.byKey(const ValueKey('amount-log')));
    await tester.pumpAndSettle();
    final entry = (await logged(tester)).single;
    expect(entry.kcal, closeTo(133.5, 1e-9));
    final p = entry.portion!;
    expect(p.method, QuantitySource.weighed);
    expect(p.basis, NutritionBasis.calculated);
    expect(p.quantity, 150);
    expect(p.unit, PortionUnit.gram);
    expect(p.reference!.basis, ReferenceBasis.per100g);
    expect(p.reference!.nutrition.kcal, 89);
    expect(
      find.textContaining('150 g · calculated from 89 kcal per 100 g'),
      findsOneWidget,
    );
  });

  testWidgets('editing a calculated entry restores it and recalculates', (
    tester,
  ) async {
    await openSheet(tester);
    await type(tester, 'food-search', 'banana');
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Banana').first);
    await tester.pumpAndSettle();
    await tapText(tester, 'Grams');
    await type(tester, 'amount-quantity', '150');
    await tester.ensureVisible(find.byKey(const ValueKey('amount-log')));
    await tester.tap(find.byKey(const ValueKey('amount-log')));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Banana'));
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(
      find.descendant(
        of: find.byKey(const ValueKey('portion-quantity')),
        matching: find.byType(TextField),
      ),
    );
    expect(field.controller!.text, '150');
    await type(tester, 'portion-quantity', '200');
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    final entry = (await logged(tester)).single;
    expect(entry.kcal, closeTo(178, 1e-9));
    expect(entry.portion!.quantity, 200, reason: 'no double scaling');
  });

  testWidgets('editing a pack food keeps which food it came from (MM-169)', (
    tester,
  ) async {
    await openSheet(tester);
    await type(tester, 'food-search', 'banana');
    await tester.pumpAndSettle();
    await tester.tap(find.textContaining('Banana').first);
    await tester.pumpAndSettle();
    await tapText(tester, 'Grams');
    await type(tester, 'amount-quantity', '150');
    await tester.ensureVisible(find.byKey(const ValueKey('amount-log')));
    await tester.tap(find.byKey(const ValueKey('amount-log')));
    await tester.pumpAndSettle();
    final origin = (await logged(tester)).single.portion!.origin;
    expect(origin, isNotNull);

    await tester.tap(find.text('Banana'));
    await tester.pumpAndSettle();
    await type(tester, 'portion-quantity', '200');
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    expect((await logged(tester)).single.portion!.origin, origin);
  });

  testWidgets('an entry logged by serving is restored as logged', (
    tester,
  ) async {
    await openSheet(tester);
    await tapText(tester, 'One serving');
    await manual(tester, name: 'Bar', kcal: '160');
    await type(tester, 'portion-quantity', '1.5');
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    expect(
      find.textContaining(
        '1.5 servings · calculated from 160 kcal per serving',
      ),
      findsOneWidget,
    );
    await tester.tap(find.text('Bar'));
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(
      find.descendant(
        of: find.byKey(const ValueKey('portion-quantity')),
        matching: find.byType(TextField),
      ),
    );
    expect(field.controller!.text, '1.5');
    expect(find.textContaining('Logs 240 kcal'), findsOneWidget);
    await tester.ensureVisible(find.text('Enter the totals myself'));
    await tester.tap(find.text('Enter the totals myself'));
    await tester.pump();
    expect(find.byKey(const ValueKey('food-kcal')), findsOneWidget);
  });

  testWidgets('an entry from before amounts were recorded invents none', (
    tester,
  ) async {
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.lunch,
        name: 'Old rice',
        kcal: 510,
        proteinG: 10,
        carbsG: 100,
        fatG: 2,
        source: QuantitySource.weighed,
      ),
    );
    await openFood(tester);
    expect(find.text('Weighed · amount not recorded'), findsOneWidget);
    await tester.tap(find.text('Old rice'));
    await tester.pumpAndSettle();
    expect(find.textContaining('logged without an amount'), findsOneWidget);
    expect(find.byKey(const ValueKey('portion-quantity')), findsNothing);
    await type(tester, 'food-kcal', '520');
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    final entry = (await logged(tester)).single;
    expect(entry.kcal, 520);
    expect(entry.portion, isNull);
  });
}
