import 'dart:async';

import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/charts/history_chart.dart';
import 'package:martian_macros/src/charts/history_series.dart';
import 'package:martian_macros/src/charts/history_series_kind.dart';
import 'package:martian_macros/src/integration_providers.dart';
import 'package:martian_macros/src/progress/strength_history_screen.dart';
import 'package:martian_macros/src/progress/strength_section.dart';
import 'package:martian_macros/src/progress/strength_trends_provider.dart';
import 'package:martian_macros/src/providers.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';
import 'package:martian_macros/src/ui/strength_trend_card.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/in_memory_overrides.dart';

void main() {
  final today = CalendarDate(2026, 10, 11);
  Workout workout({
    double load = 100,
    int daysAgo = 0,
    String exerciseId = 'barbell-bench-press',
  }) {
    final date = today.addDays(-daysAgo);
    final start = DateTime(date.year, date.month, date.day, 10);
    return Workout(
      id: 0,
      date: date,
      startedAt: start,
      endedAt: start.add(const Duration(hours: 1)),
      exercises: [
        WorkoutExercise(
          exerciseId: exerciseId,
          sets: [WorkoutSet(reps: 6, loadKg: load)],
        ),
      ],
    );
  }

  Future<void> pump(
    WidgetTester tester,
    InMemoryRepositories repos, {
    Widget home = const StrengthSection(),
    double width = 360,
    double scale = 1,
    UnitSystem units = UnitSystem.metric,
    List<Override> overrides = const [],
    bool settle = true,
  }) async {
    await repos.setup.saveSetup(
      typicalSetup().copyWith(unitSystem: UnitSystem.metric),
    );
    tester.view.physicalSize = Size(width, 900);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ...inMemoryOverrides(repos),
          clockProvider.overrideWithValue(FixedClock(today)),
          setupProvider.overrideWithValue(
            AsyncData(typicalSetup().copyWith(unitSystem: units)),
          ),
          ...overrides,
        ],
        child: MaterialApp(
          theme: mmTheme(Brightness.light),
          builder: (context, child) => MediaQuery(
            data: MediaQuery.of(context)
                .copyWith(textScaler: TextScaler.linear(scale)),
            child: child!,
          ),
          home: home is StrengthSection
              ? Scaffold(body: SingleChildScrollView(child: home))
              : home,
        ),
      ),
    );
    if (settle) {
      await tester.pumpAndSettle();
    } else {
      await tester.pump();
    }
  }

  test('MM-192 invalid evidence is an AsyncError', () async {
    final repos = InMemoryRepositories();
    final container = ProviderContainer(
      overrides: [
        ...inMemoryOverrides(repos),
        clockProvider.overrideWithValue(FixedClock(today)),
        workoutsProvider.overrideWith(
          (ref) => Stream.value([workout(load: double.nan)]),
        ),
      ],
    );
    addTearDown(container.dispose);
    container.listen(strengthTrendsProvider, (_, _) {});
    await container.read(workoutsProvider.future);
    await container.read(weightsProvider.future);
    await container.read(customExercisesProvider.future);
    final state = container.read(strengthTrendsProvider);
    expect(state.hasError, isTrue);
    expect(state.error, isArgumentError);
  });

  testWidgets('loading, read failure and retry are explicit', (tester) async {
    final repos = InMemoryRepositories();
    final stream = StreamController<List<Workout>>();
    addTearDown(stream.close);
    var attempts = 0;
    await pump(
      tester,
      repos,
      settle: false,
      overrides: [
        workoutsProvider.overrideWith((ref) {
          attempts++;
          return attempts == 1 ? stream.stream : Stream.value([workout()]);
        }),
      ],
    );
    expect(find.text('Strength trends'), findsOneWidget);
    expect(find.textContaining('Finish a workout'), findsNothing);
    stream.addError(StateError('workout read failed'), StackTrace.current);
    await tester.pumpAndSettle();
    expect(find.text('Retry strength history'), findsOneWidget);
    await tester.tap(find.text('Retry strength history'));
    await tester.pumpAndSettle();
    expect(find.text('120.0 kg'), findsOneWidget);
    expect(attempts, 2);
  });

  testWidgets('imperial presentation converts estimates and deltas', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await repos.workouts.saveWorkout(workout(load: 100, daysAgo: 28));
    await repos.workouts.saveWorkout(workout(load: 110));
    await pump(tester, repos, units: UnitSystem.imperial);
    expect(find.text('277.8 lb'), findsOneWidget);
    expect(find.text('4 weeks: +13.2 lb'), findsOneWidget);
    expect(find.text('12 weeks: Not enough history'), findsOneWidget);
  });

  testWidgets('detail chart includes older history', (tester) async {
    final repos = InMemoryRepositories();
    await repos.workouts.saveWorkout(workout(daysAgo: 200));
    await pump(
      tester,
      repos,
      home: const StrengthHistoryScreen(exerciseId: 'barbell-bench-press'),
    );
    final chart = tester.widget<HistoryChart>(find.byType(HistoryChart));
    expect(chart.days, 201);
    expect(find.textContaining('No records in this range'), findsNothing);
  });

  testWidgets('empty data is honest and a new workout appears reactively', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await pump(tester, repos);
    expect(
      find.text('Finish a workout in Train to start your strength history.'),
      findsOneWidget,
    );
    final id = await repos.workouts.saveWorkout(workout());
    await tester.pumpAndSettle();
    expect(find.byType(StrengthTrendCard), findsOneWidget);
    expect(find.text('120.0 kg'), findsOneWidget);
    await repos.workouts.saveWorkout(workout(load: 80).copyWith(id: id));
    await tester.pumpAndSettle();
    expect(find.text('96.0 kg'), findsOneWidget);
    await repos.workouts.deleteWorkout(id);
    await tester.pumpAndSettle();
    expect(find.byType(StrengthTrendCard), findsNothing);
  });

  testWidgets('all histories include unusable lifts and same-day sessions', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await repos.workouts.saveWorkout(workout());
    await repos.workouts.saveWorkout(workout(load: 110));
    await repos.workouts.saveWorkout(workout(exerciseId: 'pull-up', load: 0));
    await pump(tester, repos);
    await tester.tap(find.text('All lift histories'));
    await tester.pumpAndSettle();
    expect(find.text('Pull-up'), findsOneWidget);
    await tester.tap(find.text('Pull-up'));
    await tester.pumpAndSettle();
    expect(find.textContaining('No usable estimate yet'), findsOneWidget);
    expect(find.textContaining('Uses total bodyweight'), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();
    await tester.tap(find.text('Barbell bench press'));
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(find.text('Qualifying sessions'), 300);
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('strength-session-1')), findsOneWidget);
    expect(find.byKey(const ValueKey('strength-session-2')), findsOneWidget);
  });

  testWidgets('top four cards, comparisons and small/large-text layouts', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await DemoSeed(today).replace(
      eraser: repos.eraser,
      setup: repos.setup,
      weights: repos.weights,
      waist: repos.waist,
      food: repos.food,
      dayMarks: repos.dayMarks,
      targets: repos.targets,
      recovery: repos.recovery,
      workouts: repos.workouts,
    );
    await pump(tester, repos, width: 320, scale: 1.5);
    expect(find.byType(StrengthTrendCard), findsNWidgets(4));
    expect(find.textContaining('12 weeks: +'), findsWidgets);
    expect(tester.takeException(), isNull);
  });

  testWidgets('historical weight correction recomputes bodyweight strength', (
    tester,
  ) async {
    final repos = InMemoryRepositories();
    await repos.workouts.saveWorkout(workout(exerciseId: 'pull-up', load: 0));
    await repos.weights.saveWeight(today, 80);
    await pump(
      tester,
      repos,
      home: const StrengthHistoryScreen(exerciseId: 'pull-up'),
    );
    expect(find.text('96.0 kg'), findsOneWidget);
    await repos.weights.saveWeight(today, 90);
    await tester.pumpAndSettle();
    expect(find.text('108.0 kg'), findsOneWidget);
  });

  testWidgets(
    'gap limit is opt-in, exact 28 days connects, longer gaps break',
    (tester) async {
      final values = {
        today.addDays(-57): 100.0,
        today.addDays(-29): 110.0,
        today: 120.0,
      };
      await tester.pumpWidget(
        MaterialApp(
          theme: mmTheme(Brightness.light),
          home: Scaffold(
            body: HistoryChart(
              today: today,
              days: 91,
              unit: 'kg',
              series: [
                HistorySeries(
                  label: 'Strength',
                  kind: HistorySeriesKind.estimate,
                  values: values,
                  connectRecordedPoints: true,
                  maximumGapDays: 28,
                ),
                HistorySeries(
                  label: 'Unchanged',
                  kind: HistorySeriesKind.target,
                  values: values,
                  connectRecordedPoints: true,
                ),
              ],
            ),
          ),
        ),
      );
      final bars = tester
          .widget<LineChart>(find.byType(LineChart))
          .data
          .lineBarsData;
      expect(bars.first.spots, [
        const FlSpot(33, 100),
        const FlSpot(61, 110),
        FlSpot.nullSpot,
        const FlSpot(90, 120),
      ]);
      expect(bars.last.spots, hasLength(3));
      final handle = tester.ensureSemantics();
      await tester.pump();
      expect(
        find.bySemanticsLabel(RegExp('Strength: 3 recorded points')),
        findsOneWidget,
      );
      handle.dispose();
    },
  );
}
