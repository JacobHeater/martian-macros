import 'package:flutter/material.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food/scan/barcode_scanner_provider.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/fake_barcode_scanner.dart';
import 'support/pump_app.dart';

/// MM-45: foods and recipes the user saves once and logs in any amount.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
  });

  Future<void> open(
    WidgetTester tester, {
    List<Override> overrides = const [],
  }) async {
    await pumpApp(tester, repos, FixedClock(today), overrides: overrides);
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
  }

  Future<void> type(WidgetTester tester, String key, String value) async {
    final finder = find.byKey(ValueKey(key));
    await tester.ensureVisible(finder);
    await tester.enterText(finder, value);
    await tester.pump();
  }

  Future<void> tapKey(WidgetTester tester, String key) async {
    final finder = find.byKey(ValueKey(key));
    await tester.ensureVisible(finder);
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  Future<List<FoodEntry>> logged(WidgetTester tester) =>
      readNow(tester, () => repos.food.watchFood(today).first);

  Future<void> createBar(WidgetTester tester) async {
    await tapKey(tester, 'food-my-foods');
    await tapKey(tester, 'new-custom-food');
    await type(tester, 'custom-name', 'Protein bar');
    await type(tester, 'custom-serving', '1 bar');
    await type(tester, 'custom-grams', '30');
    await type(tester, 'custom-protein', '10');
    await type(tester, 'custom-carbs', '12');
    await type(tester, 'custom-fat', '4');
    await type(tester, 'custom-kcal', '120');
    await tapKey(tester, 'custom-save');
  }

  testWidgets('a saved food is logged in any amount', (tester) async {
    await open(tester);
    await createBar(tester);
    expect(find.text('Protein bar'), findsOneWidget);
    await tester.tap(find.text('Back'));
    await tester.pumpAndSettle();

    await type(tester, 'food-search', 'protein');
    await tester.pumpAndSettle();
    expect(find.text('Your food · 1 bar · 120 kcal'), findsOneWidget);
    await tester.tap(find.text('Protein bar'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Grams'));
    await tester.pump();
    await type(tester, 'amount-quantity', '45');
    expect(find.textContaining('180 kcal'), findsOneWidget);
    await tapKey(tester, 'amount-log');

    final entry = (await logged(tester)).single;
    expect(entry.name, 'Protein bar');
    expect(entry.kcal, closeTo(180, 1e-9));
    expect(entry.proteinG, closeTo(15, 1e-9));
    expect(entry.portion!.quantity, 45);
    expect(entry.portion!.unit, PortionUnit.gram);
    expect(entry.portion!.reference!.basis, ReferenceBasis.perServing);
  });

  testWidgets('editing a saved food does not rewrite what was logged', (
    tester,
  ) async {
    await open(tester);
    await createBar(tester);
    await tester.tap(find.text('Back'));
    await tester.pumpAndSettle();
    await type(tester, 'food-search', 'protein');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Protein bar'));
    await tester.pumpAndSettle();
    await tapKey(tester, 'amount-log');
    expect((await logged(tester)).single.kcal, 120);

    // Change the food's calories afterwards.
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
    await tapKey(tester, 'food-my-foods');
    await tester.tap(find.text('Protein bar').last);
    await tester.pumpAndSettle();
    await type(tester, 'custom-kcal', '150');
    await tapKey(tester, 'custom-save');
    final saved = (await readNow(
      tester,
      () => repos.customFoods.watchCustomFoods().first,
    )).single;
    expect(saved.perServing.kcal, 150);
    expect((await logged(tester)).single.kcal, 120);
  });

  testWidgets('calories that disagree with the macros warn', (tester) async {
    await open(tester);
    await tapKey(tester, 'food-my-foods');
    await tapKey(tester, 'new-custom-food');
    await type(tester, 'custom-protein', '10');
    await type(tester, 'custom-carbs', '10');
    await type(tester, 'custom-fat', '5');
    await type(tester, 'custom-kcal', '400');
    expect(find.textContaining('Macros add up to 125 kcal'), findsOneWidget);
  });

  testWidgets('a recipe divides its ingredients into servings', (tester) async {
    await open(tester);
    await tapKey(tester, 'food-my-foods');
    await tapKey(tester, 'new-recipe');
    await type(tester, 'recipe-name', 'Chili');
    await type(tester, 'recipe-servings', '4');
    for (final (name, kcal, protein) in [
      ('Beef', '1000', '100'),
      ('Beans', '600', '40'),
    ]) {
      if (find.byKey(const ValueKey('ingredient-name')).evaluate().isEmpty) {
        await tester.ensureVisible(find.text('Enter numbers instead'));
        await tester.tap(find.text('Enter numbers instead'));
        await tester.pump();
      }
      await type(tester, 'ingredient-name', name);
      await type(tester, 'ingredient-kcal', kcal);
      await type(tester, 'ingredient-protein', protein);
      await tapKey(tester, 'ingredient-add');
    }
    expect(find.textContaining('One serving: 400 kcal'), findsOneWidget);
    expect(find.textContaining('35 g protein'), findsOneWidget);
    await tapKey(tester, 'recipe-save');

    final chili = (await readNow(
      tester,
      () => repos.customFoods.watchCustomFoods().first,
    )).single;
    expect(chili.kind, CustomFoodKind.recipe);
    expect(chili.servings, 4);
    expect(chili.perServing.kcal, 400);
    expect(chili.servingGrams, isNull, reason: 'no cooked weight given');
    expect(chili.ingredients, hasLength(2));

    await tester.tap(find.text('Back'));
    await tester.pumpAndSettle();
    await type(tester, 'food-search', 'chili');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Chili'));
    await tester.pumpAndSettle();
    expect(find.text('Grams'), findsNothing, reason: 'servings only');
    await type(tester, 'amount-quantity', '1.5');
    expect(find.textContaining('600 kcal'), findsOneWidget);
    await tapKey(tester, 'amount-log');
    final entry = (await logged(tester)).single;
    expect(entry.kcal, 600);
    expect(entry.portion!.quantity, 1.5);
    expect(entry.portion!.unit, PortionUnit.serving);
  });

  testWidgets('a cooked weight lets a recipe be logged by weight', (
    tester,
  ) async {
    await repos.customFoods.saveCustomFood(
      const CustomFood(
        id: 0,
        name: 'Stew',
        kind: CustomFoodKind.recipe,
        servingDescription: '1 serving',
        servingGrams: 300,
        perServing: NutritionTotals(
          kcal: 450,
          proteinG: 30,
          carbsG: 40,
          fatG: 15,
        ),
        servings: 4,
        cookedWeightGrams: 1200,
      ),
    );
    await open(tester);
    await type(tester, 'food-search', 'stew');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Stew'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Grams'));
    await tester.pump();
    await type(tester, 'amount-quantity', '150');
    expect(find.textContaining('225 kcal'), findsOneWidget);
  });

  testWidgets('scanning a barcode that is a saved food finds it', (
    tester,
  ) async {
    await repos.customFoods.saveCustomFood(
      const CustomFood(
        id: 0,
        name: 'Granola from the shop',
        kind: CustomFoodKind.food,
        servingDescription: '1 cup',
        servingGrams: 60,
        perServing: NutritionTotals(
          kcal: 250,
          proteinG: 6,
          carbsG: 40,
          fatG: 8,
        ),
        barcode: '00036000291452',
      ),
    );
    await open(
      tester,
      overrides: [
        barcodeScannerProvider.overrideWithValue(
          const FakeBarcodeScanner('0', cameraAvailable: false),
        ),
      ],
    );
    await tapKey(tester, 'food-scan');
    await type(tester, 'barcode-digits', '036000291452');
    await tapKey(tester, 'barcode-lookup');
    expect(find.text('Granola from the shop'), findsOneWidget);
    expect(find.byKey(const ValueKey('amount-log')), findsOneWidget);
  });

  testWidgets('deleting a saved food asks first and keeps logged entries', (
    tester,
  ) async {
    await repos.customFoods.saveCustomFood(
      const CustomFood(
        id: 0,
        name: 'Old bar',
        kind: CustomFoodKind.food,
        servingDescription: '1 bar',
        servingGrams: 40,
        perServing: NutritionTotals(
          kcal: 200,
          proteinG: 5,
          carbsG: 30,
          fatG: 7,
        ),
      ),
    );
    await open(tester);
    await tapKey(tester, 'food-my-foods');
    await tester.tap(find.byTooltip('Delete Old bar'));
    await tester.pumpAndSettle();
    expect(find.text('Delete Old bar?'), findsOneWidget);
    await tester.tap(find.text('Delete').last);
    await tester.pumpAndSettle();
    expect(find.text('Nothing saved yet.'), findsOneWidget);
  });
}
