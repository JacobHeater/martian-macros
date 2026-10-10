import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-190: the meal a new entry starts in follows the app's clock, not the
/// device's. When it read the device, the same tests passed in the morning and
/// failed in the afternoon.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
  });

  Future<Meal> mealLoggedAt(WidgetTester tester, int hour) async {
    await pumpApp(tester, repos, FixedClock(today, hour: hour));
    await tester.tap(find.text('Add food'));
    await tester.pumpAndSettle();
    await tester.enterText(find.byKey(const ValueKey('food-name')), 'Eggs');
    await tester.enterText(find.byKey(const ValueKey('food-protein')), '12');
    await tester.pump();
    await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
    await tester.tap(find.byKey(const ValueKey('food-save')));
    await tester.pumpAndSettle();
    final logged = await readNow(
      tester,
      () => repos.food.watchFood(today).first,
    );
    return logged.single.meal;
  }

  for (final (hour, meal) in [
    (8, Meal.breakfast),
    (12, Meal.lunch),
    (19, Meal.dinner),
    (22, Meal.snack),
  ]) {
    testWidgets('food added at $hour:00 starts in ${meal.name}', (
      tester,
    ) async {
      expect(await mealLoggedAt(tester, hour), meal);
    });
  }
}
