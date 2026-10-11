import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/app/martian_macros_app.dart';
import 'package:martian_macros/src/food/food_screen.dart';
import 'package:martian_macros/src/integration_providers.dart';
import 'package:martian_macros/src/charts/macro_split_chart.dart';
import 'package:martian_macros/src/ui/mm_button.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'goldens/load_golden_fonts.dart';
import 'support/in_memory_overrides.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUpAll(loadGoldenFonts);
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

  Future<void> pumpApp(
    WidgetTester tester, {
    Size physicalSize = const Size(1080, 2400),
    double devicePixelRatio = 2.5,
  }) async {
    tester.view.physicalSize = physicalSize;
    tester.view.devicePixelRatio = devicePixelRatio;
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
    int onboardedDaysAgo = 45,
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
    expect(find.textContaining('kcal left'), findsOneWidget);
  });

  testWidgets('a normal day shows calories, protein and the trend weight', (
    tester,
  ) async {
    await seed(
      history: [targets(today.addDays(-30), 2400)],
      foods: [food('Lunch', 700, 45), food('Dinner', 700, 50)],
    );
    await pumpApp(tester);
    expect(find.text('1,000'), findsOneWidget);
    expect(find.text('kcal left of 2,400'), findsOneWidget);
    expect(find.text('95 / 170 g'), findsOneWidget);
    expect(find.text('Trend weight'), findsOneWidget);
    expect(find.text('Last 7 days'), findsOneWidget);
  });

  testWidgets('MM-208: Dashboard Add food action clears macro chart labels', (
    tester,
  ) async {
    await seed(
      history: [targets(today.addDays(-30), 2400)],
      foods: [food('Lunch', 700, 45), food('Dinner', 700, 50)],
    );
    await pumpApp(
      tester,
      physicalSize: const Size(720, 1600),
      devicePixelRatio: 2,
    );

    final addFoodButton = find.ancestor(
      of: find.text('Add food'),
      matching: find.byType(MmButton),
    );
    final labels = find.descendant(
      of: find.byType(MacroSplitChart),
      matching: find.byWidgetPredicate(
        (widget) =>
            widget is Text &&
            [
              'Protein\n',
              'Carbs\n',
              'Fat\n',
            ].any((prefix) => widget.data?.startsWith(prefix) == true),
      ),
    );

    expect(addFoodButton, findsOneWidget);
    expect(labels, findsNWidgets(3));
    for (var i = 0; i < 3; i++) {
      final label = labels.at(i);
      expect(
        tester.getRect(addFoodButton).overlaps(tester.getRect(label)),
        isFalse,
        reason: 'The Dashboard Add food action must not cover chart labels.',
      );
    }

    tester.binding.platformDispatcher.textScaleFactorTestValue = 1.5;
    await tester.pumpAndSettle();
    final chart = find.byType(MacroSplitChart);
    await tester.ensureVisible(chart);
    await tester.pumpAndSettle();
    final viewport = tester.getRect(find.byType(ListView).first);
    for (var i = 0; i < 3; i++) {
      final label = labels.at(i);
      await tester.ensureVisible(label);
      await tester.pumpAndSettle();
      final labelRect = tester.getRect(label);
      expect(
        viewport.contains(labelRect.topLeft) &&
            viewport.contains(labelRect.bottomRight),
        isTrue,
        reason:
            'Every enlarged chart label must remain reachable by scrolling.',
      );
      expect(
        tester.getRect(addFoodButton).overlaps(labelRect),
        isFalse,
        reason: 'The Dashboard Add food action must not cover chart labels.',
      );
    }
  });

  testWidgets(
    'MM-206: Dashboard logging ignores Food historical-day selection',
    (tester) async {
      final yesterday = today.addDays(-1);

      await seed(
        history: [targets(today.addDays(-30), 2400)],
        foods: [food('Today baseline', 700, 45)],
      );
      await repos.food.addFood(
        FoodEntry(
          id: 0,
          date: yesterday,
          meal: Meal.lunch,
          name: 'Yesterday baseline',
          kcal: 300,
          proteinG: 20,
          carbsG: 25,
          fatG: 5,
          source: QuantitySource.weighed,
        ),
      );
      await pumpApp(tester);

      await tester.tap(find.text('Food'));
      await tester.pumpAndSettle();
      await tester.tap(find.byTooltip('Previous day'));
      await tester.pumpAndSettle();
      expect(find.text('Yesterday'), findsOneWidget);

      // Use bottom navigation, not the intake hero that clears selection.
      await tester.tap(find.text('Dashboard'));
      await tester.pumpAndSettle();
      expect(find.byType(FoodScreen), findsNothing);
      expect(find.text('1,700'), findsOneWidget);
      expect(find.text('kcal left of 2,400'), findsOneWidget);

      await tester.tap(find.text('Add food'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const ValueKey('food-name')),
        'MM-206 new food',
      );
      await tester.enterText(find.byKey(const ValueKey('food-kcal')), '510');
      await tester.pump();
      await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const ValueKey('food-save')));
      await tester.pumpAndSettle();

      final todays = (await tester.runAsync(
        () => repos.food.watchFood(today).first,
      ))!;
      final historical = (await tester.runAsync(
        () => repos.food.watchFood(yesterday).first,
      ))!;

      final added = todays.where((e) => e.name == 'MM-206 new food');
      expect(added, hasLength(1));
      expect(added.single.date.epochDay, today.epochDay);
      expect(added.single.kcal, 510);
      expect(todays, hasLength(2));
      expect(historical, hasLength(1));
      expect(historical.single.name, 'Yesterday baseline');
      expect(historical.single.kcal, 300);

      expect(find.byKey(const ValueKey('food-save')), findsNothing);
      expect(find.byType(FoodScreen), findsNothing);
      expect(find.text('Today'), findsOneWidget);
      expect(find.text('1,190'), findsOneWidget);
      expect(find.text('kcal left of 2,400'), findsOneWidget);

      await tester.tap(find.text('Food'));
      await tester.pumpAndSettle();
      expect(find.text('Yesterday'), findsOneWidget);
      await tester.tap(find.text('Add food'));
      await tester.pumpAndSettle();
      await tester.enterText(
        find.byKey(const ValueKey('food-name')),
        'MM-206 historical food',
      );
      await tester.enterText(find.byKey(const ValueKey('food-kcal')), '250');
      await tester.pump();
      await tester.ensureVisible(find.byKey(const ValueKey('food-save')));
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const ValueKey('food-save')));
      await tester.pumpAndSettle();

      final historicalAfter = (await tester.runAsync(
        () => repos.food.watchFood(yesterday).first,
      ))!;
      expect(
        historicalAfter.where((e) => e.name == 'MM-206 historical food'),
        hasLength(1),
      );
      expect(
        historicalAfter
            .singleWhere((e) => e.name == 'MM-206 historical food')
            .date
            .epochDay,
        yesterday.epochDay,
      );
      final todaysAfter = (await tester.runAsync(
        () => repos.food.watchFood(today).first,
      ))!;
      expect(todaysAfter, hasLength(2));
    },
  );

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
    await tester.ensureVisible(
      find.byKey(const ValueKey('save-dashboard-weigh-in')),
    );
    await tester.pumpAndSettle();
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
    expect(
      find.textContaining('Targets went down about 80 kcal'),
      findsOneWidget,
    );
  });

  testWidgets('tapping the intake card opens the Food screen', (tester) async {
    await seed(history: [targets(today.addDays(-30), 2400)]);
    await pumpApp(tester);
    await tester.tap(find.textContaining('kcal left'));
    await tester.pumpAndSettle();
    expect(find.byType(FoodScreen), findsOneWidget);
  });
}
