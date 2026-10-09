import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/progress/progress_screen.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-93: Progress, waist and day-rollover behavior that shipped without a
/// test (MM-17, MM-21, MM-90).
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;
  late FixedClock clock;

  setUp(() async {
    repos = InMemoryRepositories();
    clock = FixedClock(today);
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
  });

  Future<void> openProgress(WidgetTester tester) async {
    await pumpApp(tester, repos, clock);
    await tester.tap(find.text('Progress'));
    await tester.pumpAndSettle();
  }

  testWidgets('the trend chart draws readings, a line and a band', (
    tester,
  ) async {
    for (var d = 20; d >= 0; d--) {
      await repos.weights.saveWeight(
        today.addDays(-d),
        83 - (20 - d) * 0.05 + (d.isEven ? 0.3 : -0.3),
      );
    }
    await openProgress(tester);
    final chart = tester.widget<LineChart>(find.byType(LineChart));
    // Two hidden band edges, the trend line, and the raw readings.
    expect(chart.data.lineBarsData, hasLength(4));
    final trendLine = chart.data.lineBarsData[2];
    expect(trendLine.spots.length, greaterThan(10));
    expect(chart.data.lineBarsData[3].spots, hasLength(21));
    expect(chart.data.betweenBarsData, isNotEmpty);
  });

  testWidgets('waist shows the latest measurement and the change', (
    tester,
  ) async {
    await repos.weights.saveWeight(today, 82);
    await repos.waist.saveWaist(today.addDays(-14), 90);
    await repos.waist.saveWaist(today, 88.5);
    await openProgress(tester);
    await tester.scrollUntilVisible(
      find.textContaining('Latest:'),
      200,
      scrollable: find
          .descendant(
            of: find.byType(ProgressScreen),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    expect(find.textContaining('Latest:'), findsOneWidget);
    expect(find.textContaining('since'), findsWidgets);
    // 90 cm to 88.5 cm is a fall of 0.6 in.
    expect(find.textContaining('−0.6 in'), findsOneWidget);
  });

  testWidgets('a waist measurement can be saved from its card', (tester) async {
    await repos.weights.saveWeight(today, 82);
    await openProgress(tester);
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('entry-waist')),
      200,
      scrollable: find
          .descendant(
            of: find.byType(ProgressScreen),
            matching: find.byType(Scrollable),
          )
          .first,
    );
    await tester.enterText(find.byKey(const ValueKey('entry-waist')), '35');
    await tester.pump();
    await tester.ensureVisible(find.byKey(const ValueKey('save-waist')));
    await tester.tap(find.byKey(const ValueKey('save-waist')));
    await tester.pumpAndSettle();
    final saved = await readNow(tester, () => repos.waist.watchWaist().first);
    expect(saved.single.waistCm, closeTo(88.9, 0.1));
    expect(saved.single.date.epochDay, today.epochDay);
  });

  testWidgets('the day rolls over while the app is open', (tester) async {
    await repos.weights.saveWeight(today, 82);
    await repos.food.addFood(
      FoodEntry(
        id: 0,
        date: today,
        meal: Meal.lunch,
        name: 'Chicken and rice',
        kcal: 510,
        proteinG: 45,
        carbsG: 60,
        fatG: 10,
        source: QuantitySource.weighed,
      ),
    );
    await pumpApp(tester, repos, clock);
    await tester.tap(find.text('Food'));
    await tester.pumpAndSettle();
    expect(find.text('Chicken and rice'), findsOneWidget);

    // Midnight passes while the app is in the background.
    clock.advanceTo(today.addDays(1));
    tester.binding.handleAppLifecycleStateChanged(AppLifecycleState.resumed);
    await tester.pumpAndSettle();
    expect(find.text('Chicken and rice'), findsNothing, reason: 'a new day');

    await tester.tap(find.byTooltip('Previous day'));
    await tester.pumpAndSettle();
    expect(find.text('Yesterday'), findsOneWidget);
    expect(find.text('Chicken and rice'), findsOneWidget);
  });
}
