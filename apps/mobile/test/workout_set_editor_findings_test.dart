import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// Two defects in a workout set's controls, found by the walkthrough review
/// of workout logging (MM-212, run `mm212-workout-logging-walkthrough`).
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

  Future<void> tap(WidgetTester tester, String key) async {
    final finder = find.byKey(ValueKey(key));
    await tester.ensureVisible(finder);
    await tester.pumpAndSettle();
    await tester.tap(finder);
    await tester.pumpAndSettle();
  }

  Future<void> type(WidgetTester tester, String key, String value) async {
    final finder = find.byKey(ValueKey(key));
    await tester.ensureVisible(finder);
    await tester.enterText(finder, value);
    await tester.pumpAndSettle();
  }

  /// A workout in progress with one back squat set of 8 at 100 kg, its
  /// controls open.
  Future<void> oneSet(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Train'));
    await tester.pumpAndSettle();
    await tap(tester, 'train-start');
    await tap(tester, 'workout-add-exercise');
    await tester.enterText(
      find.byKey(const ValueKey('exercise-search')),
      'back squat',
    );
    await tester.pumpAndSettle();
    await tap(tester, 'exercise-back-squat');
    await tap(tester, 'add-set-0');
    await type(tester, 'set-0-0-reps', '8');
    await type(tester, 'set-0-0-load', '100');
  }

  Future<WorkoutSet> storedSet(WidgetTester tester) async {
    final workouts = await readNow(
      tester,
      () => repos.workouts.watchWorkouts().first,
    );
    return workouts.single.exercises.single.sets.single;
  }

  String fieldText(WidgetTester tester, String key) => tester
      .widget<TextField>(
        find.descendant(
          of: find.byKey(ValueKey(key)),
          matching: find.byType(TextField),
        ),
      )
      .controller!
      .text;

  group('MM-214: the reps field shows what is stored', () {
    for (final typed in ['', '8.5']) {
      testWidgets(
        'after typing "$typed" over 8',
        (tester) async {
          await oneSet(tester);
          await type(tester, 'set-0-0-reps', typed);

          final shown = int.tryParse(fieldText(tester, 'set-0-0-reps')) ?? 0;
          expect(
            (await storedSet(tester)).reps,
            shown,
            reason: 'the set keeps 8 while the field shows "$typed"',
          );
        },
        // Fails today: the stored reps stay at 8. Enable with the fix.
        skip: true,
      );
    }
  });

  testWidgets(
    'MM-215: removing a set can be undone',
    (tester) async {
      await oneSet(tester);
      await tap(tester, 'set-0-0-remove');

      expect(find.text('Undo'), findsOneWidget);
      await tester.tap(find.text('Undo'));
      await tester.pumpAndSettle();
      expect((await storedSet(tester)).reps, 8);
    },
    // Fails today: the set is removed at once with no way back. Enable with
    // the fix.
    skip: true,
  );
}
