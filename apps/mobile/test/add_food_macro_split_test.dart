import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/charts/macro_split_chart.dart';
import 'package:martian_macros/src/food_packs/food_catalog_provider.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'support/enter_manual_food.dart';
import 'support/pump_app.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;
  final preview = find.byKey(const ValueKey('food-macro-preview'));

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
  });

  Future<void> open(WidgetTester tester) async {
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
  }

  Future<void> type(WidgetTester tester, String key, String value) async {
    final field = find.byKey(ValueKey(key));
    await tester.ensureVisible(field);
    await tester.enterText(field, value);
    await tester.pumpAndSettle();
  }

  Future<void> tap(WidgetTester tester, String label) async {
    final target = find.text(label).last;
    await tester.ensureVisible(target);
    await tester.tap(target);
    await tester.pumpAndSettle();
  }

  List<double> sectors(WidgetTester tester) => tester
      .widget<PieChart>(
        find.descendant(of: preview, matching: find.byType(PieChart)),
      )
      .data
      .sections
      .map((s) => s.value)
      .toList();

  testWidgets(
    'manual split updates using food energy, not calories or targets',
    (tester) async {
      await open(tester);
      expect(preview, findsNothing);
      await enterManualFood(tester);
      await type(tester, 'food-protein', '100');
      await type(tester, 'food-carbs', '150');
      await type(tester, 'food-fat', '50');
      await type(tester, 'food-kcal', '2000');
      await tester.ensureVisible(preview);
      await tester.pumpAndSettle();
      expect(sectors(tester), [400, 600, 450]);
      expect(find.text('Protein\n100 g · 27.6%'), findsOneWidget);
      expect(find.text('Carbs\n150 g · 41.4%'), findsOneWidget);
      expect(find.text('Fat\n50 g · 31.0%'), findsOneWidget);
      expect(tester.widget<MacroSplitChart>(preview).isPreview, isTrue);

      await type(tester, 'food-protein', '50');
      await tester.ensureVisible(preview);
      await tester.pumpAndSettle();
      expect(sectors(tester), [200, 600, 450]);
      final entries = await readNow(
        tester,
        () => repos.food.watchFood(today).first,
      );
      expect(entries, isEmpty);
    },
  );

  testWidgets('serving basis scales chart grams and invalid values hide it', (
    tester,
  ) async {
    await open(tester);
    await enterManualFood(tester);
    await type(tester, 'food-protein', '20');
    await tap(tester, 'One serving');
    await type(tester, 'portion-quantity', '2');
    await tester.ensureVisible(preview);
    await tester.pumpAndSettle();
    expect(sectors(tester), [160]);
    expect(tester.widget<MacroSplitChart>(preview).intake.proteinG, 40);
    await type(tester, 'portion-quantity', '0');
    expect(preview, findsNothing);
    await type(tester, 'portion-quantity', '1');
    await type(tester, 'food-protein', '-1');
    expect(preview, findsNothing);
  });

  testWidgets('calories without macros do not invent a split', (tester) async {
    await open(tester);
    await enterManualFood(tester);
    await type(tester, 'food-kcal', '500');
    await tester.ensureVisible(preview);
    await tester.pumpAndSettle();
    expect(
      find.descendant(of: preview, matching: find.byType(PieChart)),
      findsNothing,
    );
    expect(
      find.textContaining('Enter macro amounts to preview'),
      findsOneWidget,
    );
  });

  testWidgets('recent entry preview starts from its saved macro totals', (
    tester,
  ) async {
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.lunch,
        name: 'Recent soup',
        kcal: 400,
        proteinG: 20,
        carbsG: 30,
        fatG: 10,
        source: QuantitySource.quickAdd,
      ),
    );
    await open(tester);
    await tap(tester, 'Recent soup');
    await tester.ensureVisible(preview);
    await tester.pumpAndSettle();
    expect(sectors(tester), [80, 120, 90]);
  });

  testWidgets('found food amount updates and invalid amounts hide the pie', (
    tester,
  ) async {
    await open(tester);
    await type(tester, 'food-search', 'Banana');
    await tap(tester, 'Banana');
    final initial = tester.widget<MacroSplitChart>(preview).intake;
    await type(tester, 'amount-quantity', '2');
    final doubled = tester.widget<MacroSplitChart>(preview).intake;
    expect(doubled.proteinG, initial.proteinG * 2);
    expect(doubled.carbsG, initial.carbsG * 2);
    expect(doubled.fatG, initial.fatG * 2);
    await type(tester, 'amount-quantity', '');
    expect(preview, findsNothing);
  });

  testWidgets('meal estimate preview changes with meal kind and size', (
    tester,
  ) async {
    await open(tester);
    await tester.tap(find.byKey(const ValueKey('food-estimate')));
    await tester.pumpAndSettle();
    await tester.ensureVisible(preview);
    await tester.pumpAndSettle();
    expect(find.text('Estimated macro split'), findsOneWidget);
    final initial = tester.widget<MacroSplitChart>(preview).intake;
    await tap(tester, 'Mostly protein (meat or fish)');
    final changed = tester.widget<MacroSplitChart>(preview).intake;
    expect(changed.proteinG, greaterThan(initial.proteinG));
    final large = find.textContaining('Large · about').first;
    await tester.ensureVisible(large);
    await tester.tap(large);
    await tester.pumpAndSettle();
    expect(
      tester.widget<MacroSplitChart>(preview).intake.kcal,
      greaterThan(changed.kcal),
    );
    expect(tester.takeException(), isNull);
  });

  testWidgets('cooking oil and preparation are reflected in the food preview', (
    tester,
  ) async {
    await open(tester);
    await type(tester, 'food-search', 'white rice');
    await tap(tester, 'White rice, cooked');
    await tap(tester, 'Grams');
    final initial = tester.widget<MacroSplitChart>(preview).intake;
    await tap(tester, '1 tsp');
    final withOil = tester.widget<MacroSplitChart>(preview).intake;
    expect(withOil.fatG, closeTo(initial.fatG + 4.5, 1e-9));
    expect(withOil.proteinG, initial.proteinG);
    expect(withOil.carbsG, initial.carbsG);
    await tap(tester, 'Raw');
    final raw = tester.widget<MacroSplitChart>(preview).intake;
    expect(raw.proteinG, 7);
    expect(raw.carbsG, 80);
    expect(raw.fatG, 0.7, reason: 'raw food does not log cooking oil');
    await tester.ensureVisible(preview);
    await tester.pumpAndSettle();
    expect(sectors(tester), [28, 320, closeTo(6.3, 1e-9)]);
  });
}
