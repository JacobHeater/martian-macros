import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/charts/trend_chart.dart';
import 'package:martian_macros/src/health/merge_weigh_ins.dart';
import 'package:martian_macros/src/progress/progress_screen.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';
import 'package:mm_health_ingest/mm_health_ingest_testing.dart';

import 'support/pump_app.dart';

/// MM-68 and MM-71: imported weigh-ins become the app's weigh-ins, and a
/// typed value overrules them.
void main() {
  final today = CalendarDate(2026, 10, 5);

  group('merging', () {
    DayWeighIn imported(int daysAgo, double kg) {
      final date = today.addDays(-daysAgo);
      return DayWeighIn(
        day: DateTime(date.year, date.month, date.day),
        kg: kg,
        basis: WeighInBasis.firstMorning,
        sourceName: 'Bathroom scale',
        readings: 1,
      );
    }

    WeightObservation typed(int daysAgo, double kg) =>
        WeightObservation(date: today.addDays(-daysAgo), weightKg: kg);

    List<(int, double)> merged(
      List<WeightObservation> typedOnes,
      List<DayWeighIn> importedOnes,
    ) => [
      for (final w in mergeWeighIns(
        typed: typedOnes,
        imported: importedOnes,
        today: today,
      ))
        (w.date.daysUntil(today), w.weightKg),
    ];

    test('imported days are added to typed ones, oldest first', () {
      expect(merged([typed(3, 82.5)], [imported(1, 82.1), imported(5, 83)]), [
        (5, 83.0),
        (3, 82.5),
        (1, 82.1),
      ]);
    });

    test('a typed value for a day is used instead of the import', () {
      expect(merged([typed(1, 81)], [imported(1, 82.1)]), [(1, 81.0)]);
    });

    test('a reading that cannot be a body weight is left out', () {
      expect(
        merged(const [], [imported(2, 0), imported(1, 820), imported(0, 82)]),
        [(0, 82.0)],
      );
    });

    test('a reading dated after today is left out', () {
      expect(merged(const [], [imported(-1, 82), imported(0, 82.4)]), [
        (0, 82.4),
      ]);
    });

    test('with nothing imported it is what was typed', () {
      expect(merged([typed(1, 82)], const []), [(1, 82.0)]);
    });
  });

  group('in the app', () {
    late InMemoryRepositories repos;
    late FakeHealthSource source;

    /// A scale that weighed every morning for [days] up to today, and once
    /// again this evening.
    String scaleHistory({int days = 10, double todayKg = 81.4}) {
      final events = <String>[];
      for (var d = days - 1; d >= 0; d--) {
        final date = today.addDays(-d);
        final day =
            '${date.year}-${date.month.toString().padLeft(2, '0')}-'
            '${date.day.toString().padLeft(2, '0')}';
        final kg = d == 0 ? todayKg : 82 + d * 0.05;
        events.add(
          '{"op": "add", "type": "weight", "id": "w-$d", "value": $kg, '
          '"start": "${day}T06:42:00", "source": "scale"}',
        );
      }
      final date = today;
      final day =
          '${date.year}-${date.month.toString().padLeft(2, '0')}-'
          '${date.day.toString().padLeft(2, '0')}';
      events.add(
        '{"op": "add", "type": "weight", "id": "evening", "value": 83.0, '
        '"start": "${day}T21:10:00", "source": "scale"}',
      );
      return '{"sources": [{"id": "scale", "name": "Bathroom scale"}], '
          '"events": [${events.join(',')}]}';
    }

    setUp(() async {
      repos = InMemoryRepositories();
      await repos.setup.saveSetup(
        typicalSetup(onboardedOn: today.addDays(-40))
            .copyWith(unitSystem: UnitSystem.metric),
      );
      source = FakeHealthSource.fromJson(scaleHistory());
      await source.permit({HealthDataType.weight});
    });

    Future<void> openProgress(WidgetTester tester) async {
      await pumpApp(tester, repos, FixedClock(today), healthSource: source);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Progress').last);
      await tester.pumpAndSettle();
    }

    String weighInField(WidgetTester tester) => tester
        .widget<TextField>(
          find.descendant(
            of: find.byKey(const ValueKey('entry-weigh-in')),
            matching: find.byType(TextField),
          ),
        )
        .controller!
        .text;

    testWidgets('opening the app reads the scale: today\'s weigh-in is its '
        'morning reading, with where it came from', (tester) async {
      await openProgress(tester);

      expect(weighInField(tester), '81.4');
      expect(
        find.text(
          'From Bathroom scale at 6:42 AM. Type a value to use yours '
          'instead.',
        ),
        findsOneWidget,
      );
      expect(
        await readNow(
          tester,
          () => repos.healthSamples.samples(HealthDataType.weight),
        ),
        hasLength(11),
      );
      // Nothing imported is written among what the user typed.
      expect(
        await readNow(tester, () => repos.weights.watchWeights().first),
        isEmpty,
      );
    });

    testWidgets('the trend is made from the imported weigh-ins', (
      tester,
    ) async {
      await openProgress(tester);
      expect(find.text('Log a weigh-in to start your trend.'), findsNothing);
      final chart = tester.widget<TrendChart>(find.byType(TrendChart));
      expect(chart.weights, hasLength(10));
      expect(chart.weights.last.weightKg, 81.4);
      expect(chart.trend, isNotEmpty);
    });

    testWidgets('typing a value for today overrules the import, which is '
        'kept', (tester) async {
      await openProgress(tester);
      await tester.enterText(
        find.byKey(const ValueKey('entry-weigh-in')),
        '80.9',
      );
      await tester.pumpAndSettle();
      await tester.tap(find.byKey(const ValueKey('save-weigh-in')));
      await tester.pumpAndSettle();

      expect(weighInField(tester), '80.9');
      expect(find.textContaining('From Bathroom scale'), findsNothing);
      final typed = await readNow(
        tester,
        () => repos.weights.watchWeights().first,
      );
      expect(typed.single.weightKg, 80.9);
      expect(
        await readNow(
          tester,
          () => repos.healthSamples.samples(HealthDataType.weight),
        ),
        hasLength(11),
      );
    });

    testWidgets('when the scale cannot be read on opening, what was kept is '
        'still used', (tester) async {
      await HealthImporter(
        source: source,
        store: repos.healthSamples,
      ).import(HealthDataType.weight);
      source.unreadable = true;
      await openProgress(tester);

      expect(weighInField(tester), '81.4');
    });

    testWidgets('with nothing allowed, nothing is read and nothing changes', (
      tester,
    ) async {
      source.revoke();
      await openProgress(tester);

      expect(weighInField(tester), isEmpty);
      expect(
        find.text('First thing in the morning, after the bathroom.'),
        findsOneWidget,
      );
      expect(find.byType(ProgressScreen), findsOneWidget);
    });
  });
}
