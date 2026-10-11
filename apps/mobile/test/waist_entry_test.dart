import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/progress/progress_screen.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-155: a waist entry of three readings, or of one.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  setUp(() async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(onboardedOn: today.addDays(-40))
          .copyWith(unitSystem: UnitSystem.metric),
    );
    await repos.weights.saveWeight(today, 82);
  });

  Future<void> openWaist(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Progress').last);
    await tester.pumpAndSettle();
    await tester.scrollUntilVisible(
      find.byKey(const ValueKey('save-waist')),
      200,
      scrollable: find
          .descendant(
            of: find.byType(ProgressScreen),
            matching: find.byType(Scrollable),
          )
          .first,
    );
  }

  Future<void> type(WidgetTester tester, List<String> readings) async {
    const keys = ['entry-waist', 'entry-waist-2', 'entry-waist-3'];
    for (var i = 0; i < readings.length; i++) {
      await tester.enterText(find.byKey(ValueKey(keys[i])), readings[i]);
    }
    await tester.pumpAndSettle();
  }

  Future<void> save(WidgetTester tester) async {
    await tester.ensureVisible(find.byKey(const ValueKey('save-waist')));
    await tester.tap(find.byKey(const ValueKey('save-waist')));
    await tester.pumpAndSettle();
  }

  bool canSave(WidgetTester tester) => tester
      .widgetList<ButtonStyleButton>(
        find.descendant(
          of: find.byKey(const ValueKey('save-waist')),
          matching: find.byWidgetPredicate((w) => w is ButtonStyleButton),
        ),
      )
      .any((button) => button.onPressed != null);

  String note(WidgetTester tester) =>
      tester.widget<Text>(find.byKey(const ValueKey('waist-entry-note'))).data!;

  Future<List<WaistObservation>> stored(WidgetTester tester) =>
      readNow(tester, () => repos.waist.watchWaist().first);

  testWidgets('three readings: the middle one is the measurement, and all '
      'three are kept', (tester) async {
    await openWaist(tester);
    expect(note(tester), 'Take three readings in cm. The middle one is kept.');
    await type(tester, ['91.5', '92.5', '92.0']);
    await save(tester);

    final entry = (await stored(tester)).single;
    expect(entry.date, today);
    expect(entry.waistCm, 92.0);
    expect(entry.readings, [91.5, 92.5, 92.0]);
    expect(find.textContaining('Latest: 92 cm on Oct 5.'), findsOneWidget);
  });

  testWidgets('one reading is a quick entry, recorded as one, and says what '
      'that costs', (tester) async {
    await openWaist(tester);
    await type(tester, ['92.4']);
    expect(note(tester), contains('It is noisier than the middle of three'));
    await save(tester);

    final entry = (await stored(tester)).single;
    expect(entry.waistCm, 92.4);
    expect(entry.readings, [92.4]);
    expect(entry.isSingleReading, isTrue);
  });

  testWidgets('two readings are neither: nothing can be saved', (tester) async {
    await openWaist(tester);
    await type(tester, ['92.4', '92.0']);
    expect(note(tester), 'Enter one reading or all three.');
    expect(canSave(tester), isFalse);

    await type(tester, ['92.4', '92.0', '91.8']);
    expect(canSave(tester), isTrue);
  });

  testWidgets('nothing typed, or something that is no number, cannot be '
      'saved', (tester) async {
    await openWaist(tester);
    expect(canSave(tester), isFalse);
    await type(tester, ['abc']);
    expect(canSave(tester), isFalse);
  });

  testWidgets('inches are entered, centimeters are stored', (tester) async {
    await repos.setup.saveSetup(typicalSetup(onboardedOn: today.addDays(-40)));
    await openWaist(tester);
    await type(tester, ['36', '36.5', '36.25']);
    await save(tester);

    final entry = (await stored(tester)).single;
    expect(entry.waistCm, closeTo(36.25 * 2.54, 1e-9));
    expect(entry.readings, hasLength(3));
  });

  testWidgets('the fields are empty again after saving, and the card says '
      'when the next is due', (tester) async {
    await openWaist(tester);
    await type(tester, ['91.5', '92.5', '92.0']);
    await save(tester);

    final field = tester.widget<TextField>(
      find.descendant(
        of: find.byKey(const ValueKey('entry-waist')),
        matching: find.byType(TextField),
      ),
    );
    expect(field.controller!.text, isEmpty);
    expect(
      find.textContaining('Weekly is enough: the next is due Oct 12.'),
      findsOneWidget,
    );
  });

  testWidgets('a reading that cannot be a waist is refused and nothing is '
      'stored', (tester) async {
    await openWaist(tester);
    await type(tester, ['920']);
    await save(tester);

    expect(find.text('That value looks off. Check it.'), findsOneWidget);
    expect(await stored(tester), isEmpty);
  });
}
