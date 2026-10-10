import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';
import 'support/reveal_on_food_screen.dart';

/// MM-150: estimate a meal by size and kind.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
  });

  Future<void> open(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.byKey(const ValueKey('food-estimate')));
    await tester.tap(find.byKey(const ValueKey('food-estimate')));
    await tester.pumpAndSettle();
  }

  testWidgets('a regular balanced meal is logged as an estimate', (
    tester,
  ) async {
    await open(tester);
    expect(
      find.textContaining('usually have more than they look'),
      findsOneWidget,
    );
    expect(find.textContaining('Regular · about'), findsOneWidget);
    await tester.enterText(
      find.byKey(const ValueKey('estimate-name')),
      'Thai place, usual',
    );
    await tester.ensureVisible(find.byKey(const ValueKey('estimate-log')));
    await tester.tap(find.byKey(const ValueKey('estimate-log')));
    await tester.pumpAndSettle();

    final entry = (await readNow(
      tester,
      () => repos.food.watchFood(today).first,
    )).single;
    expect(entry.name, 'Thai place, usual');
    expect(entry.source, QuantitySource.quickAdd);
    expect(entry.portion!.quantity, isNull);
    expect(entry.kcal % 50, 0, reason: 'rounded to 50 kcal');
    // Carbohydrate, protein and fat follow the balanced split.
    expect(
      4 * entry.proteinG + 4 * entry.carbsG + 9 * entry.fatG,
      closeTo(entry.kcal, 1e-6),
    );
    await revealOnFoodScreen(tester, find.text('Estimated totals'));
    expect(find.text('Estimated totals'), findsOneWidget);
  });

  testWidgets('a larger size and a richer kind change the entry', (
    tester,
  ) async {
    await open(tester);
    await tester.tap(find.textContaining('Large · about'));
    await tester.pump();
    final rich = find.textContaining('Rich (fried');
    await tester.ensureVisible(rich);
    await tester.tap(rich);
    await tester.pump();
    await tester.ensureVisible(find.byKey(const ValueKey('estimate-log')));
    await tester.tap(find.byKey(const ValueKey('estimate-log')));
    await tester.pumpAndSettle();
    final entry = (await readNow(
      tester,
      () => repos.food.watchFood(today).first,
    )).single;
    expect(entry.name, 'Estimated meal (large, rich)');
    expect(entry.fatG * 9 / entry.kcal, closeTo(0.50, 1e-9));
  });
}
