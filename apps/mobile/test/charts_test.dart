import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/integration_providers.dart';
import 'package:martian_macros/src/progress/progress_screen.dart';
import 'package:martian_macros/src/progress/weight_event_label.dart';
import 'package:martian_macros/src/theme/mm_theme.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/in_memory_overrides.dart';

void main() {
  final today = CalendarDate(2026, 10, 5);

  Future<InMemoryRepositories> pump(
    WidgetTester tester,
    int weighIns, {
    List<WeightEvent> events = const [],
    CalendarDate? creatineStartedOn,
  }) async {
    final repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-30))
          .copyWith(creatineStartedOn: () => creatineStartedOn),
    );
    for (var d = weighIns - 1; d >= 0; d--) {
      await repos.weights.saveWeight(today.addDays(-d), 82 + d * 0.1);
    }
    for (final event in events) {
      await repos.weightEvents.saveWeightEvent(event);
    }
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.5;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          ...inMemoryOverrides(repos),
          clockProvider.overrideWithValue(FixedClock(today)),
        ],
        child: MaterialApp(
          theme: mmTheme(Brightness.light),
          home: const Scaffold(body: ProgressScreen()),
        ),
      ),
    );
    await tester.pumpAndSettle();
    return repos;
  }

  testWidgets('a single weigh-in says a trend needs more', (tester) async {
    await pump(tester, 1);
    expect(find.text('A trend needs more weigh-ins.'), findsOneWidget);
  });

  testWidgets('several weigh-ins do not show that sentence', (tester) async {
    await pump(tester, 8);
    expect(find.text('A trend needs more weigh-ins.'), findsNothing);
  });

  testWidgets('the chart has a caption a screen reader reads', (tester) async {
    final handle = tester.ensureSemantics();
    await pump(tester, 8);
    expect(
      find.bySemanticsLabel(RegExp(r'Weight trend over the last 30 days')),
      findsOneWidget,
    );
    handle.dispose();
  });

  testWidgets('weight events appear as chart markers', (tester) async {
    await pump(
      tester,
      8,
      events: [
        WeightEvent(date: today.addDays(-3), type: WeightEventType.travel),
        WeightEvent(date: today.addDays(-2), type: WeightEventType.illness),
        WeightEvent(date: today.addDays(-1), type: WeightEventType.newTraining),
      ],
    );

    final chart = tester.widget<LineChart>(find.byType(LineChart));
    expect(chart.data.extraLinesData.verticalLines, hasLength(3));
    expect(
      find.textContaining('two other events in this 14-day window'),
      findsOneWidget,
    );
  });

  testWidgets('the onboarding creatine date is marked on the chart', (
    tester,
  ) async {
    await pump(tester, 8, creatineStartedOn: today.addDays(-4));

    final chart = tester.widget<LineChart>(find.byType(LineChart));
    expect(chart.data.extraLinesData.verticalLines, hasLength(1));
    expect(find.textContaining('Started creatine'), findsOneWidget);
  });

  testWidgets('the Progress screen offers retrospective event entry', (
    tester,
  ) async {
    await pump(tester, 8);
    await tester.tap(find.text('Add'));
    await tester.pumpAndSettle();

    expect(find.text('Add a weight event'), findsOneWidget);
    expect(
      find.text('Events can be added for the last 28 days.'),
      findsOneWidget,
    );
    await tester.tap(find.text('Date'));
    await tester.pumpAndSettle();
    final picker = tester.widget<DatePickerDialog>(
      find.byType(DatePickerDialog),
    );
    expect(CalendarDate.fromDateTime(picker.firstDate), today.addDays(-28));
    expect(CalendarDate.fromDateTime(picker.lastDate), today);
    await tester.tap(find.text('Cancel').last);
    await tester.pumpAndSettle();
  });

  testWidgets(
    'every event kind is offered and a saved event redraws the chart',
    (tester) async {
      final repos = await pump(tester, 8);
      expect(
        find.textContaining('If you start or stop creatine later'),
        findsOneWidget,
      );
      await tester.tap(find.text('Add'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Illness'));
      await tester.pumpAndSettle();
      for (final type in WeightEventType.values) {
        expect(find.text(weightEventLabel(type)), findsWidgets);
      }
      await tester.tap(find.text('Started creatine').last);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Save event'));
      await tester.pumpAndSettle();
      final saved = (await tester.runAsync(
        () => repos.weightEvents.watchWeightEvents().first,
      ))!;
      expect(saved.single.date, today);
      expect(saved.single.type, WeightEventType.startedCreatine);
      final chart = tester.widget<LineChart>(find.byType(LineChart));
      expect(chart.data.extraLinesData.verticalLines.single.x, 29);
    },
  );
}
