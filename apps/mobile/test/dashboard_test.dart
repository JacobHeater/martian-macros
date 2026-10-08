import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/app/martian_macros_app.dart';
import 'package:martian_macros/src/food/food_screen.dart';
import 'package:martian_macros/src/integration_providers.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/in_memory_overrides.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() => repos = InMemoryRepositories());

  TargetsRecord targets(CalendarDate from, double kcal) => TargetsRecord(
    effectiveFrom: from,
    mode: GoalMode.fatLoss,
    tdeeKcal: 2700,
    tdeeSigmaKcal: 400,
    tdeeStatus: TdeeStatus.held,
    targets: DailyTargets(
      kcal: kcal,
      proteinG: 170,
      fatG: 70,
      carbsG: 250,
      weeklyRateFraction: -0.0075,
    ),
  );

  FoodEntry food(String name, double kcal, double protein) => FoodEntry(
    id: 0,
    date: today,
    meal: Meal.lunch,
    name: name,
    kcal: kcal,
    proteinG: protein,
    carbsG: 40,
    fatG: 10,
    source: QuantitySource.weighed,
  );

  Future<void> pumpApp(WidgetTester tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.5;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ...inMemoryOverrides(repos),
          clockProvider.overrideWithValue(FixedClock(today)),
        ],
        child: const MartianMacrosApp(),
      ),
    );
    await tester.pumpAndSettle();
  }

  Future<void> seed({
    int onboardedDaysAgo = 30,
    bool weighedToday = true,
    List<TargetsRecord> history = const [],
    List<FoodEntry> foods = const [],
  }) async {
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-onboardedDaysAgo)),
    );
    for (var d = 7; d >= (weighedToday ? 0 : 1); d--) {
      await repos.weights.saveWeight(today.addDays(-d), 82 + d * 0.05);
    }
    for (final record in history) {
      await repos.targets.saveTargets(record);
    }
    for (final entry in foods) {
      await repos.food.addFood(entry);
    }
  }

  testWidgets('the app opens on the dashboard with four destinations', (
    tester,
  ) async {
    await seed(history: [targets(today.addDays(-30), 2400)]);
    await pumpApp(tester);
    for (final label in ['Dashboard', 'Food', 'Progress', 'Coach']) {
      expect(find.text(label), findsWidgets);
    }
    expect(
      find.byType(FoodScreen),
      findsNothing,
      reason: 'food is not showing',
    );
    expect(find.textContaining('remaining'), findsOneWidget);
  });

  testWidgets('a normal day shows calories, protein and the trend weight', (
    tester,
  ) async {
    await seed(
      history: [targets(today.addDays(-30), 2400)],
      foods: [food('Lunch', 700, 45), food('Dinner', 700, 50)],
    );
    await pumpApp(tester);
    expect(find.text('1,400'), findsOneWidget);
    expect(find.text('of 2,400 kcal'), findsOneWidget);
    expect(find.text('1,000 kcal remaining'), findsOneWidget);
    expect(find.text('95 / 170 g'), findsOneWidget);
    expect(find.text('Trend weight'), findsOneWidget);
    expect(find.text('Last 7 days'), findsOneWidget);
  });

  testWidgets('with no weigh-in today the weight card asks for one', (
    tester,
  ) async {
    await seed(
      weighedToday: false,
      history: [targets(today.addDays(-30), 2400)],
    );
    await pumpApp(tester);
    expect(find.text('Today’s weigh-in'), findsOneWidget);
    await tester.enterText(
      find.byKey(const ValueKey('entry-dashboard-weigh-in')),
      '181.4',
    );
    await tester.pump();
    await tester.tap(find.byKey(const ValueKey('save-dashboard-weigh-in')));
    await tester.pumpAndSettle();
    final weights = (await tester.runAsync(
      () => repos.weights.watchWeights().first,
    ))!;
    expect(weights.last.date.epochDay, today.epochDay);
    expect(weights.last.weightKg, closeTo(82.28, 0.01));
    // Once saved, the card shows the trend and no longer asks.
    expect(find.text('Today’s weigh-in'), findsNothing);
    expect(find.text('Trend weight'), findsOneWidget);
  });

  testWidgets('during calibration the coach card says which day', (
    tester,
  ) async {
    await seed(
      onboardedDaysAgo: 5,
      history: [targets(today.addDays(-5), 2400)],
    );
    await pumpApp(tester);
    expect(find.textContaining('Calibration, day 6 of 14'), findsOneWidget);
  });

  testWidgets('after a check-in the coach card says what changed', (
    tester,
  ) async {
    await seed(
      history: [
        targets(today.addDays(-30), 2400),
        targets(today.addDays(-2), 2320),
      ],
    );
    await pumpApp(tester);
    expect(find.textContaining('Targets went down 80 kcal'), findsOneWidget);
  });

  testWidgets('tapping the intake card opens the Food screen', (tester) async {
    await seed(history: [targets(today.addDays(-30), 2400)]);
    await pumpApp(tester);
    await tester.tap(find.textContaining('remaining'));
    await tester.pumpAndSettle();
    expect(find.byType(FoodScreen), findsOneWidget);
  });
}
