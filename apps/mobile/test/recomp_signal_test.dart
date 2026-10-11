import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:martian_macros/src/progress/progress_screen.dart';
import 'package:mm_domain/mm_domain.dart';
import 'package:mm_fixtures/mm_fixtures.dart';

import 'support/pump_app.dart';

/// MM-32: the recomp signal card on Progress.
void main() {
  final today = CalendarDate(2026, 10, 5);
  late InMemoryRepositories repos;

  Future<void> setUpUser({UnitSystem units = UnitSystem.metric}) async {
    repos = InMemoryRepositories();
    await repos.setup.saveSetup(
      typicalSetup(
        onboardedOn: today.addDays(-60),
        goalMode: GoalMode.recomp,
      ).copyWith(unitSystem: units),
    );
  }

  setUp(setUpUser);

  /// Six weeks of daily weigh-ins from [fromKg] to [toKg].
  Future<void> weighed(double fromKg, double toKg) async {
    for (var d = 42; d >= 0; d--) {
      await repos.weights.saveWeight(
        today.addDays(-d),
        fromKg + (toKg - fromKg) * (42 - d) / 42 + (d.isEven ? 0.2 : -0.2),
      );
    }
  }

  Future<void> waist(Map<int, double> byDaysAgo) async {
    for (final entry in byDaysAgo.entries) {
      await repos.waist.saveWaist(today.addDays(-entry.key), entry.value);
    }
  }

  /// Six weekly sessions of squat and row, the last yesterday, each a
  /// little heavier when [rising].
  Future<void> trained({bool rising = true}) async {
    for (var week = 5; week >= 0; week--) {
      final date = today.addDays(-1 - week * 7);
      final start = DateTime(date.year, date.month, date.day, 18);
      final more = rising ? (5 - week) * 2.5 : 0.0;
      await repos.workouts.saveWorkout(
        Workout(
          id: 0,
          date: date,
          startedAt: start,
          endedAt: start.add(const Duration(minutes: 50)),
          exercises: [
            WorkoutExercise(
              exerciseId: 'back-squat',
              sets: [WorkoutSet(reps: 6, loadKg: 100 + more)],
            ),
            WorkoutExercise(
              exerciseId: 'barbell-row',
              sets: [WorkoutSet(reps: 6, loadKg: 60 + more)],
            ),
          ],
        ),
      );
    }
  }

  Future<void> openProgress(WidgetTester tester) async {
    await pumpApp(tester, repos, FixedClock(today));
    await tester.tap(find.text('Progress').last);
    await tester.pumpAndSettle();
  }

  final card = find.byKey(const ValueKey('recomp-signal'));

  /// Scrolls Progress to its end, building everything on the way.
  Future<void> scrollThrough(WidgetTester tester) async {
    final list = find
        .descendant(
          of: find.byType(ProgressScreen),
          matching: find.byType(Scrollable),
        )
        .first;
    for (var i = 0; i < 12 && card.evaluate().isEmpty; i++) {
      await tester.drag(list, const Offset(0, -300));
      await tester.pumpAndSettle();
    }
  }

  String cardText(WidgetTester tester) => tester
      .widget<Text>(find.byKey(const ValueKey('recomp-signal-text')))
      .data!;

  testWidgets('weight flat, waist down, two lifts up: the signal is shown', (
    tester,
  ) async {
    await weighed(82, 82);
    await waist({30: 92, 24: 92, 10: 90, 3: 90});
    await trained();
    await openProgress(tester);
    await scrollThrough(tester);

    expect(card, findsOneWidget);
    expect(find.text('Recomp signal'), findsOneWidget);
    final text = cardText(tester);
    expect(text, contains('Trend weight held near 82.0 kg.'));
    expect(text, contains('Waist down about 2 cm.'));
    expect(text, contains('Estimated maxes are up on '));
    expect(text, contains('back squat'));
    expect(text, contains('barbell row'));
    expect(text, contains('It does not measure either.'));
    expect(text, isNot(contains('gained muscle')));
  });

  testWidgets('a waist change is shown to the quarter inch', (tester) async {
    await setUpUser(units: UnitSystem.imperial);
    await weighed(82, 82);
    await waist({30: 92, 24: 92, 10: 90, 3: 90});
    await trained();
    await openProgress(tester);
    await scrollThrough(tester);

    expect(cardText(tester), contains('Waist down about 0.75 in.'));
  });

  testWidgets('with no waist logged it asks for a weekly measurement', (
    tester,
  ) async {
    await weighed(82, 82);
    await trained();
    await openProgress(tester);
    await scrollThrough(tester);

    expect(find.text('Close to a recomp signal'), findsOneWidget);
    expect(
      cardText(tester),
      'Your trend weight is holding and your lifts are going up. Measure '
      'your waist once a week to see whether it is coming down too.',
    );
  });

  testWidgets('with no training logged it asks for that', (tester) async {
    await weighed(82, 82);
    await waist({30: 92, 24: 92, 10: 90, 3: 90});
    await openProgress(tester);
    await scrollThrough(tester);

    expect(cardText(tester), contains('Log your training'));
  });

  testWidgets('falling weight is fat loss: no card', (tester) async {
    await weighed(84, 81.5);
    await waist({30: 92, 24: 92, 10: 90, 3: 90});
    await trained();
    await openProgress(tester);
    await scrollThrough(tester);

    expect(card, findsNothing);
  });

  testWidgets('a waist that went up is no card, not a prompt', (tester) async {
    await weighed(82, 82);
    await waist({30: 90, 24: 90, 10: 92, 3: 92});
    await trained();
    await openProgress(tester);
    await scrollThrough(tester);

    expect(card, findsNothing);
  });

  testWidgets('lifts that did not go up are no card', (tester) async {
    await weighed(82, 82);
    await waist({30: 92, 24: 92, 10: 90, 3: 90});
    await trained(rising: false);
    await openProgress(tester);
    await scrollThrough(tester);

    expect(card, findsNothing);
  });
}
