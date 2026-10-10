import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/ui/horizon_arc.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-187: the arc is the one calorie visual, on every screen that shows a
/// day's calories.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await repos.weights.saveWeight(today, 82);
    await repos.targets.saveTargets(
      TargetsRecord(
        effectiveFrom: today.addDays(-3),
        mode: GoalMode.fatLoss,
        tdeeKcal: 2600,
        tdeeSigmaKcal: 300,
        tdeeStatus: TdeeStatus.held,
        targets: const DailyTargets(
          kcal: 2000,
          proteinG: 160,
          fatG: 70,
          carbsG: 200,
          weeklyRateFraction: -0.0075,
        ),
      ),
    );
  });

  Future<void> openTab(WidgetTester tester, String tab) async {
    await pumpApp(tester, repos, FixedClock(today));
    if (tab != 'Dashboard') {
      await tester.tap(find.text(tab));
      await tester.pumpAndSettle();
    }
  }

  for (final tab in ['Dashboard', 'Food', 'Coach']) {
    testWidgets('$tab shows exactly one arc', (tester) async {
      await openTab(tester, tab);
      expect(find.byType(HorizonArc), findsOneWidget);
    });
  }

  testWidgets('the Coach screen has no calorie figure of its own', (
    tester,
  ) async {
    await openTab(tester, 'Coach');
    // The old hero card said "kcal a day" under a figure of its own.
    expect(find.text('kcal a day'), findsNothing);
    expect(find.text('Daily targets'), findsNothing);
    expect(find.textContaining('kcal left of 2,000'), findsOneWidget);
  });

  testWidgets('during a pause the Coach arc is the guide, never over', (
    tester,
  ) async {
    await repos.pauses.savePause(
      Pause(
        from: today.addDays(-1),
        to: today.addDays(4),
        reason: PauseReason.travel,
      ),
    );
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.dinner,
        name: 'Wedding dinner',
        kcal: 3400,
        proteinG: 120,
        carbsG: 380,
        fatG: 140,
        source: QuantitySource.weighed,
      ),
    );
    await openTab(tester, 'Coach');
    expect(find.byType(HorizonArc), findsOneWidget);
    expect(find.textContaining('paused, guide'), findsOneWidget);
    expect(find.textContaining('kcal over'), findsNothing);
  });
}
