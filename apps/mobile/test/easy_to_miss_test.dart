import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-152: the easy-to-miss line under a completed day.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  Future<void> start({
    int dayOfUse = 3,
    bool complete = true,
    bool eatingDisorderHistory = false,
  }) async {
    repos = InMemoryRepositories();
    final onboarded = today.addDays(-(dayOfUse - 1));
    var setup = typicalSetup(onboardedOn: onboarded);
    if (eatingDisorderHistory) {
      setup = setup.copyWith(
        screening: const ScreeningAnswers(eatingDisorderHistory: true),
      );
    }
    await repos.setup.saveSetup(setup);
    await repos.weights.saveWeight(today, 82);
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.lunch,
        name: 'Soup',
        kcal: 300,
        proteinG: 10,
        carbsG: 30,
        fatG: 5,
        source: QuantitySource.weighed,
      ),
    );
    if (complete) {
      await repos.dayMarks.setCompleteness(today, DayCompleteness.complete);
    }
  }

  Future<void> openFood(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView).first, const Offset(0, -600));
    await tester.pumpAndSettle();
  }

  testWidgets('the line appears under a completed day in the first weeks', (
    tester,
  ) async {
    await start();
    await openFood(tester);
    expect(find.text('Easy to miss'), findsOneWidget);
    for (final item in [
      'cooking oil',
      'drinks',
      'sauces',
      'bites and tastes',
    ]) {
      expect(find.byKey(ValueKey('easy-to-miss-$item')), findsOneWidget);
    }
    final shown = await readNow(
      tester,
      () => repos.preferences.watchEasyToMiss().first,
    );
    expect(shown.lastShown, today, reason: 'recorded once it is shown');
  });

  testWidgets('it is not shown for a day that is not marked complete', (
    tester,
  ) async {
    await start(complete: false);
    await openFood(tester);
    expect(find.text('Easy to miss'), findsNothing);
  });

  testWidgets('cooking oil opens add-food with oil searched', (tester) async {
    await start();
    await openFood(tester);
    await tester.tap(find.byKey(const ValueKey('easy-to-miss-cooking oil')));
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(
      find.descendant(
        of: find.byKey(const ValueKey('food-search')),
        matching: find.byType(TextField),
      ),
    );
    expect(field.controller!.text, 'oil');
  });

  testWidgets('bites and tastes opens the estimate sheet at Light', (
    tester,
  ) async {
    await start();
    await openFood(tester);
    await tester.tap(
      find.byKey(const ValueKey('easy-to-miss-bites and tastes')),
    );
    await tester.pumpAndSettle();
    expect(find.text('Estimate a meal'), findsOneWidget);
    expect(find.textContaining('Light · about'), findsOneWidget);
  });

  testWidgets('a month in, shown yesterday: not shown; a week on: shown', (
    tester,
  ) async {
    await start(dayOfUse: 30);
    await repos.preferences.markEasyToMissShown(today.addDays(-1));
    await openFood(tester);
    expect(find.text('Easy to miss'), findsNothing);
  });

  testWidgets('a month in, not shown for a week: shown', (tester) async {
    await start(dayOfUse: 30);
    await repos.preferences.markEasyToMissShown(today.addDays(-8));
    await openFood(tester);
    expect(find.text('Easy to miss'), findsOneWidget);
  });

  testWidgets('turned off in settings, it never appears', (tester) async {
    await start();
    await repos.preferences.saveEasyToMissEnabled(false);
    await openFood(tester);
    expect(find.text('Easy to miss'), findsNothing);
  });

  testWidgets('not shown with an eating-disorder history', (tester) async {
    await start(eatingDisorderHistory: true);
    await openFood(tester);
    expect(find.text('Easy to miss'), findsNothing);
  });
}
