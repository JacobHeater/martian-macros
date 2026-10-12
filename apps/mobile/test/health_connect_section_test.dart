import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';
import 'package:mm_health_ingest/mm_health_ingest.dart';
import 'package:mm_health_ingest/mm_health_ingest_testing.dart';

import 'support/pump_app.dart';

/// MM-68: connecting Health Connect from Settings, one kind of reading at
/// a time.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;
  late FakeHealthSource source;

  Future<void> setUpUser({BiologicalSex sex = BiologicalSex.male}) async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-40), sex: sex),
    );
    await repos.weights.saveWeight(today, 82);
  }

  setUp(() async {
    await setUpUser();
    source = FakeHealthSource.fromJson(recordedHealthHistory, happened: 9);
  });

  Future<void> openSettings(
    WidgetTester tester, {
    bool withSource = true,
  }) async {
    await pumpApp(
      tester,
      repos,
      FixedClock(today),
      healthSource: withSource ? source : null,
    );
    await tester.tap(find.byTooltip('Settings'));
    await tester.pumpAndSettle();
  }

  Future<void> show(WidgetTester tester, String key) async {
    await tester.scrollUntilVisible(
      find.byKey(ValueKey(key)),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.pumpAndSettle();
  }

  Future<void> tap(WidgetTester tester, String key) async {
    await show(tester, key);
    await tester.ensureVisible(find.byKey(ValueKey(key)));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(ValueKey(key)));
    await tester.pumpAndSettle();
  }

  String row(WidgetTester tester, String key) => tester
      .widgetList<Text>(
        find.descendant(
          of: find.byKey(ValueKey(key)),
          matching: find.byType(Text),
        ),
      )
      .map((t) => t.data ?? '')
      .join(' | ');

  Future<List<HealthSample>> stored(WidgetTester tester, HealthDataType type) =>
      readNow(tester, () => repos.healthSamples.samples(type));

  testWidgets('a phone without Health Connect says so and offers nothing', (
    tester,
  ) async {
    await openSettings(tester, withSource: false);
    await show(tester, 'health-absent');
    expect(
      find.textContaining('Health Connect is not on this phone'),
      findsOneWidget,
    );
    expect(find.byKey(const ValueKey('health-weight')), findsNothing);
    expect(find.byKey(const ValueKey('health-import')), findsNothing);
  });

  testWidgets('each kind is offered with what it is for, and nothing is read '
      'before it is allowed', (tester) async {
    await openSettings(tester);
    await show(tester, 'health-weight');
    expect(
      row(tester, 'health-weight'),
      'Weight | Not allowed. Weigh-ins from your scale, so you need not '
      'type them.',
    );
    expect(await stored(tester, HealthDataType.weight), isEmpty);
    expect(find.byKey(const ValueKey('health-import')), findsNothing);
  });

  testWidgets('allowing weight imports it, with where it came from, and '
      'leaves the other kinds alone', (tester) async {
    await openSettings(tester);
    await tap(tester, 'health-weight');

    expect(await stored(tester, HealthDataType.weight), hasLength(5));
    expect(
      row(tester, 'health-weight'),
      'Weight | Allowed. 5 readings from Bathroom scale, Health app, typed.',
    );
    await show(tester, 'health-bodyFat');
    expect(row(tester, 'health-bodyFat'), contains('Not allowed.'));
    expect(await stored(tester, HealthDataType.bodyFat), isEmpty);
    expect(await source.permitted(), {HealthDataType.weight});
    // What the user typed is not touched by an import.
    final typed = await readNow(
      tester,
      () => repos.weights.watchWeights().first,
    );
    expect(typed.single.weightKg, 82);
  });

  testWidgets('refusing a kind leaves it not allowed and says how to allow '
      'it later', (tester) async {
    source.willPermit = {};
    await openSettings(tester);
    await tap(tester, 'health-weight');

    expect(find.textContaining('Weight was not allowed.'), findsOneWidget);
    expect(row(tester, 'health-weight'), contains('Not allowed.'));
    expect(await stored(tester, HealthDataType.weight), isEmpty);
  });

  testWidgets('reading again brings an edit and a deletion made since', (
    tester,
  ) async {
    await openSettings(tester);
    await tap(tester, 'health-weight');
    source.letAllHappen();
    await tap(tester, 'health-import');

    final weights = await stored(tester, HealthDataType.weight);
    expect(
      [for (final s in weights) s.platformId],
      ['w-1', 'w-3', 'w-4', 'w-5', 'w-6'],
    );
    expect(weights[1].value, 82.4);
  });

  testWidgets('when Health Connect cannot be read, it says so and nothing '
      'kept is changed', (tester) async {
    await openSettings(tester);
    await tap(tester, 'health-weight');
    final before = await stored(tester, HealthDataType.weight);

    source
      ..letAllHappen()
      ..expireTokens()
      ..unreadable = true;
    await tap(tester, 'health-import');

    expect(
      find.text(
        'Health Connect could not be read just now. Nothing was changed.',
      ),
      findsOneWidget,
    );
    expect(await stored(tester, HealthDataType.weight), before);
  });

  testWidgets('a permission taken away later is noticed, and what was read '
      'is kept', (tester) async {
    await source.permit({HealthDataType.weight});
    await openSettings(tester);
    await tap(tester, 'health-import');
    expect(row(tester, 'health-weight'), contains('Allowed.'));

    source.revoke();
    await tap(tester, 'health-import');
    await show(tester, 'health-weight');
    expect(row(tester, 'health-weight'), contains('Not allowed.'));
    expect(await stored(tester, HealthDataType.weight), hasLength(5));
  });

  group('menstruation', () {
    const withCycle = '''
{"sources": [{"id": "app", "name": "Cycle app"}],
 "events": [
  {"op": "add", "type": "weight", "id": "w", "value": 60, "start": "2026-09-01T07:00:00", "source": "app"},
  {"op": "add", "type": "menstruation", "id": "m", "value": 1, "start": "2026-09-01T00:00:00", "source": "app"}
 ]}''';

    testWidgets('is offered to a female profile', (tester) async {
      await setUpUser(sex: BiologicalSex.female);
      source = FakeHealthSource.fromJson(withCycle);
      await openSettings(tester);
      await show(tester, 'health-menstruation');
      expect(
        row(tester, 'health-menstruation'),
        contains('To allow for water weight around your period.'),
      );
    });

    testWidgets('is not offered to a male profile', (tester) async {
      source = FakeHealthSource.fromJson(withCycle);
      await openSettings(tester);
      await show(tester, 'health-weight');
      expect(find.byKey(const ValueKey('health-menstruation')), findsNothing);
    });
  });
}
