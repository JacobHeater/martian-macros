import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/charts/history_chart.dart';
import 'package:martian_macros/src/charts/history_series.dart';
import 'package:martian_macros/src/charts/history_series_kind.dart';
import 'package:martian_macros/src/dashboard/dashboard_metrics.dart';
import 'package:martian_macros/src/dashboard/dashboard_range_provider.dart';
import 'package:martian_macros/src/providers.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_engine/mm_engine.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/in_memory_overrides.dart';

void main() {
  final today = CalendarDate(2026, 10, 10);
  late InMemoryRepositories repos;
  setUp(() => repos = InMemoryRepositories());

  Future<void> seed() async {
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-60)));
    await repos.targets.saveTargets(
      TargetsRecord(
        effectiveFrom: today.addDays(-60),
        mode: GoalMode.fatLoss,
        tdeeKcal: 2800,
        tdeeSigmaKcal: 170,
        tdeeStatus: TdeeStatus.updated,
        targets: const DailyTargets(
          kcal: 2300,
          proteinG: 170,
          fatG: 70,
          carbsG: 250,
          weeklyRateFraction: -0.0075,
        ),
      ),
    );
    for (var i = 0; i < 30; i++) {
      final date = today.addDays(-i);
      await repos.weights.saveWeight(date, 82 + i * 0.05);
      await repos.food.addFood(
        FoodEntry(
          id: 0,
          date: date,
          meal: Meal.lunch,
          name: 'Recorded meal',
          kcal: 2300,
          proteinG: 170,
          carbsG: 250,
          fatG: 70,
          source: QuantitySource.weighed,
        ),
      );
      await repos.dayMarks.setCompleteness(date, DayCompleteness.complete);
    }
    await repos.waist.saveWaist(today.addDays(-20), 92);
    await repos.waist.saveWaist(today.addDays(-6), 90);
  }

  Future<void> pump(WidgetTester tester, {bool dark = false}) async {
    tester.view.physicalSize = const Size(640, 1600);
    tester.view.devicePixelRatio = 2;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ...inMemoryOverrides(repos),
          todayProvider.overrideWithValue(today),
        ],
        child: MaterialApp(
          theme: mmTheme(dark ? Brightness.dark : Brightness.light),
          home: const Scaffold(
            body: SingleChildScrollView(child: DashboardMetrics()),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  for (final dark in [false, true]) {
    testWidgets('populated narrow metrics overview without overflow ($dark)', (
      tester,
    ) async {
      await seed();
      await pump(tester, dark: dark);
      for (final title in [
        'Nutrition history',
        'Protein history',
        'Weight trend & uncertainty',
        'Waist history',
        'Logging coverage',
        'Coach & expenditure',
        'How you are holding up',
      ]) {
        await tester.ensureVisible(find.text(title));
        await tester.pumpAndSettle();
        expect(find.text(title), findsOneWidget);
        expect(tester.takeException(), isNull);
      }
      expect(find.byType(HistoryChart), findsNWidgets(4));
    });
  }

  testWidgets('range control changes the chart and recorded-day window', (
    tester,
  ) async {
    await seed();
    await pump(tester);
    expect(find.text('30 / 30'), findsNWidgets(4));
    await tester.tap(find.text('7 days'));
    await tester.pumpAndSettle();
    expect(find.text('7 / 7'), findsNWidgets(4));
    final chart = tester.widget<HistoryChart>(find.byType(HistoryChart).first);
    expect(chart.days, 7);
    final container = ProviderScope.containerOf(
      tester.element(find.byType(DashboardMetrics)),
    );
    expect(container.read(dashboardRangeProvider), 7);
  });

  testWidgets('empty histories explain how to populate the sections', (
    tester,
  ) async {
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today));
    await pump(tester);
    expect(
      find.text('Log food to populate your intake history.'),
      findsOneWidget,
    );
    expect(find.text('No records in this range yet.'), findsWidgets);
    expect(find.text('Not recorded'), findsWidgets);
    expect(find.text('No coaching estimate available.'), findsOneWidget);
  });

  testWidgets('history loading does not become an empty chart', (tester) async {
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today));
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ...inMemoryOverrides(repos),
          todayProvider.overrideWithValue(today),
          intakeDaysProvider.overrideWith((ref) => const Stream.empty()),
        ],
        child: MaterialApp(
          theme: mmTheme(Brightness.light),
          home: const Scaffold(body: DashboardMetrics()),
        ),
      ),
    );
    await tester.pump();
    expect(find.text('Loading your recorded metrics…'), findsOneWidget);
    expect(find.text('No records in this range yet.'), findsNothing);
  });

  testWidgets('history errors are visible rather than empty success', (
    tester,
  ) async {
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today));
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ...inMemoryOverrides(repos),
          todayProvider.overrideWithValue(today),
          intakeDaysProvider.overrideWith(
            (ref) => Stream<List<IntakeDay>>.error(StateError('unavailable')),
          ),
        ],
        child: MaterialApp(
          theme: mmTheme(Brightness.light),
          home: const Scaffold(body: DashboardMetrics()),
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(
      find.text(
        'Dashboard history could not be loaded. Reopen the app to retry.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('missing intake days remain line gaps', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: mmTheme(Brightness.light),
        home: Scaffold(
          body: HistoryChart(
            series: [
              HistorySeries(
                label: 'Logged intake',
                values: {today.addDays(-2): 2000, today: 2200},
                kind: HistorySeriesKind.energy,
              ),
            ],
            today: today,
            days: 7,
            unit: 'kcal',
          ),
        ),
      ),
    );
    expect(tester.takeException(), isNull);
    expect(find.text('● Logged intake'), findsOneWidget);
    final spots = tester
        .widget<LineChart>(find.byType(LineChart))
        .data
        .lineBarsData
        .single
        .spots;
    expect(spots.length, 7);
    expect(spots[4], const FlSpot(4, 2000));
    expect(spots[5], FlSpot.nullSpot);
    expect(spots[6], const FlSpot(6, 2200));
    final semantics = tester.getSemantics(
      find.byWidgetPredicate(
        (w) =>
            w is Semantics &&
            (w.properties.label?.startsWith('kcal history') ?? false),
      ),
    );
    expect(semantics.label, contains('2 recorded points'));
  });
}
