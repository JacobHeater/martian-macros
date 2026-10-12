import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/food_packs/food_catalog_provider.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_food_catalog/mm_food_catalog.dart';

import 'support/pump_app.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);

  testWidgets('discovery and manual entry are separate steps', (tester) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
    tester.view.physicalSize = const Size(720, 1600);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.lunch,
        name: 'Oats with milk',
        kcal: 300,
        proteinG: 12,
        carbsG: 45,
        fatG: 8,
        source: QuantitySource.quickAdd,
      ),
    );
    await pumpApp(
      tester,
      repos,
      FixedClock(today),
      overrides: [
        foodCatalogProvider.overrideWith((ref) async => FoodCatalog([])),
      ],
    );
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('food-search')), findsOneWidget);
    expect(find.text('Recent foods'), findsOneWidget);
    expect(find.text('Oats with milk'), findsWidgets);
    expect(find.text('Enter manually'), findsOneWidget);
    expect(find.byKey(const ValueKey('food-name')), findsNothing);
    expect(find.byKey(const ValueKey('food-protein')), findsNothing);
    expect(find.byKey(const ValueKey('food-save')), findsNothing);

    await tester.tap(find.text('Enter manually'));
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('food-search')), findsNothing);
    expect(find.text('Food name'), findsOneWidget);
    expect(find.byKey(const ValueKey('food-name')), findsOneWidget);
    expect(find.byKey(const ValueKey('food-protein')), findsOneWidget);
    expect(find.text('Scan'), findsNothing);
    expect(find.text('Saved'), findsNothing);
    expect(find.byKey(const ValueKey('food-estimate')), findsNothing);

    await tester.enterText(
      find.byKey(const ValueKey('food-name')),
      'Homemade soup',
    );
    await tester.tap(find.text('Back to food choices'));
    await tester.pumpAndSettle();

    expect(find.byKey(const ValueKey('food-search')), findsOneWidget);
    expect(find.byKey(const ValueKey('food-name')), findsNothing);
    expect(find.text('Recent foods'), findsOneWidget);
    await tester.tap(find.text('Enter manually'));
    await tester.pumpAndSettle();
    final nameField = tester.widget<TextField>(
      find.descendant(
        of: find.byKey(const ValueKey('food-name')),
        matching: find.byType(TextField),
      ),
    );
    expect(nameField.controller!.text, 'Homemade soup');

    await tester.tap(find.text('Back to food choices'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Oats with milk').last);
    await tester.pumpAndSettle();
    final recentNameField = tester.widget<TextField>(
      find.descendant(
        of: find.byKey(const ValueKey('food-name')),
        matching: find.byType(TextField),
      ),
    );
    expect(recentNameField.controller!.text, 'Oats with milk');
    await tester.tap(find.text('Back to food choices'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('food-search')), 'Tuna');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Enter manually'));
    await tester.pumpAndSettle();
    final searchedNameField = tester.widget<TextField>(
      find.descendant(
        of: find.byKey(const ValueKey('food-name')),
        matching: find.byType(TextField),
      ),
    );
    expect(searchedNameField.controller!.text, 'Tuna');
  });
}
